// Content script - extracts page content for job analysis

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractPageContent') {
    try {
      // Extract relevant content from the page
      const pageData = {
        url: window.location.href,
        title: document.title,
        bodyText: extractRelevantText(),
        metaDescription: getMetaDescription()
      };
      
      sendResponse(pageData);
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }
  return true; // Keep message channel open for async response
});

// Extract relevant text content (limit size for API)
function extractRelevantText() {
  // Try to find job-specific content first
  const selectors = [
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[class*="job-details"]',
    '[class*="jobDetails"]',
    '[class*="posting"]',
    '[id*="job"]',
    'article',
    'main',
    '.content',
    '#content'
  ];

  let text = '';
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      elements.forEach(el => {
        text += el.innerText + '\n';
      });
      break;
    }
  }

  // Fallback to body text if no specific content found
  if (!text) {
    text = document.body.innerText;
  }

  // Clean and limit text
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();

  // Limit to 32k chars (generous limit for high rate limits)
  return text.substring(0, 32000);
}

// Get meta description
function getMetaDescription() {
  const meta = document.querySelector('meta[name="description"]');
  return meta ? meta.getAttribute('content') : '';
}
