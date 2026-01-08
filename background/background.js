// Background service worker - handles API calls and data processing

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processJob') {
    processJobPosting(request.pageData)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

// Main processing function
async function processJobPosting(pageData) {
  try {
    // Get config
    const config = await chrome.storage.sync.get(['geminiApiKey', 'webhookUrl']);
    
    if (!config.geminiApiKey) {
      throw new Error('Gemini API key not configured. Please go to settings.');
    }
    
    if (!config.webhookUrl) {
      throw new Error('Google Apps Script webhook URL not configured. Please go to settings.');
    }

    // Analyze with Gemini
    const jobData = await analyzeWithGemini(pageData, config.geminiApiKey);
    jobData.url = pageData.url;

    // Save to Google Sheet
    await saveToGoogleSheet(jobData, config.webhookUrl);

    return { success: true, data: jobData };
  } catch (error) {
    console.error('Error processing job:', error);
    return { success: false, error: error.message };
  }
}

// Analyze job posting with Google Gemini API
async function analyzeWithGemini(pageData, apiKey) {
  const prompt = `Analyze this job posting and extract information in JSON format. Return ONLY valid JSON, no markdown, no code blocks, no other text.

Required JSON structure:
{
  "company": "Company/Organization name",
  "jobTitle": "Job title/position",
  "positionType": "Full-time, Part-time, Contract, Per Diem, or Unknown",
  "location": "City, State or Remote",
  "salary": "Salary/pay range if mentioned, otherwise null",
  "schedule": "Work schedule (e.g., Day shift, Night shift, Weekends, Rotating, 9-5, Flexible, etc.) or null if not mentioned",
  "experienceLevel": "Required experience level (e.g., Entry Level, 1-2 years, 3-5 years, Senior, etc.) or null if not mentioned",
  "description": "SUPER Brief ONLY 10 word summary of the role"
}

Page Title: ${pageData.title}
Page URL: ${pageData.url}
Meta Description: ${pageData.metaDescription || 'N/A'}

Page Content:
${pageData.bodyText}

Remember: Return ONLY the JSON object, nothing else.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response from Gemini API');
  }

  let jsonText = data.candidates[0].content.parts[0].text.trim();
  
  // Clean up response - remove markdown code blocks if present
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error('Failed to parse Gemini response:', jsonText);
    // Return basic fallback data
    return {
      company: 'Unknown',
      jobTitle: pageData.title || 'Unknown',
      positionType: 'Unknown',
      location: 'Unknown',
      salary: null,
      schedule: null,
      experienceLevel: null,
      description: 'Could not extract details automatically'
    };
  }
}

// Save to Google Sheet via Apps Script webhook
async function saveToGoogleSheet(jobData, webhookUrl) {
  const payload = {
    dateApplied: new Date().toLocaleDateString(),
    company: jobData.company || 'Unknown',
    jobTitle: jobData.jobTitle || 'Unknown',
    positionType: jobData.positionType || 'Unknown',
    location: jobData.location || 'Unknown',
    salary: jobData.salary || 'Not Listed',
    schedule: jobData.schedule || 'Not Listed',
    experienceLevel: jobData.experienceLevel || 'Not Listed',
    url: jobData.url || '',
    status: 'Applied',
    description: jobData.description || ''
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Failed to save to Google Sheet. Check your webhook URL.');
  }

  const result = await response.json().catch(() => ({ success: true }));
  
  if (result.error) {
    throw new Error(result.error);
  }

  return result;
}
