// Content script - extracts page content for job analysis

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'extractPageContent') {
    try {
      // Extract relevant content from the page
      const pageData = {
        url: window.location.href,
        title: document.title,
        bodyText: extractBodyContent(),
        metaDescription: getMetaDescription()
      };
      
      sendResponse(pageData);
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }
  return true; // Keep message channel open for async response
});

// Extract full body content (HTML stripped of scripts/styles, converted to text)
function extractBodyContent() {
  // Clone body to avoid modifying the actual page
  const bodyClone = document.body.cloneNode(true);
  
  // Remove script and style elements
  const removeElements = bodyClone.querySelectorAll('script, style, noscript, iframe, svg');
  removeElements.forEach(el => el.remove());
  
  // Get text content from the cleaned HTML
  let text = bodyClone.innerText || bodyClone.textContent || '';
  
  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();

  // Limit to 200k chars
  return text.substring(0, 200000);
}

// Get meta description
function getMetaDescription() {
  const meta = document.querySelector('meta[name="description"]');
  return meta ? meta.getAttribute('content') : '';
}
