document.addEventListener('DOMContentLoaded', async () => {
  const captureBtn = document.getElementById('capture-btn');
  const statusDiv = document.getElementById('status');
  const settingsLink = document.getElementById('settings-link');
  const openSettingsBtn = document.getElementById('open-settings');
  const notConfigured = document.getElementById('not-configured');
  const mainContent = document.getElementById('main-content');
  const previewDiv = document.getElementById('preview');
  const previewContent = document.getElementById('preview-content');

  // Check if configured
  const config = await chrome.storage.sync.get(['geminiApiKey', 'webhookUrl']);
  
  if (!config.geminiApiKey || !config.webhookUrl) {
    notConfigured.style.display = 'block';
    mainContent.style.display = 'none';
  }

  // Open settings
  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  settingsLink.addEventListener('click', (e) => {
    e.preventDefault();
    openSettings();
  });

  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', openSettings);
  }

  // Show status message
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    if (type === 'loading') {
      statusDiv.innerHTML = `<span class="spinner"></span>${message}`;
    }
  }

  // Show preview
  function showPreview(data) {
    previewDiv.style.display = 'block';
    previewContent.innerHTML = `
      <div class="preview-item"><span class="preview-label">Company:</span><span class="preview-value">${data.company || 'N/A'}</span></div>
      <div class="preview-item"><span class="preview-label">Title:</span><span class="preview-value">${data.jobTitle || 'N/A'}</span></div>
      <div class="preview-item"><span class="preview-label">Location:</span><span class="preview-value">${data.location || 'N/A'}</span></div>
      <div class="preview-item"><span class="preview-label">Type:</span><span class="preview-value">${data.positionType || 'N/A'}</span></div>
      <div class="preview-item"><span class="preview-label">Schedule:</span><span class="preview-value">${data.schedule || 'Not Listed'}</span></div>
      <div class="preview-item"><span class="preview-label">Experience:</span><span class="preview-value">${data.experienceLevel || 'Not Listed'}</span></div>
      <div class="preview-item"><span class="preview-label">Salary:</span><span class="preview-value">${data.salary || 'Not Listed'}</span></div>
    `;
  }

  // Capture job
  captureBtn.addEventListener('click', async () => {
    captureBtn.disabled = true;
    previewDiv.style.display = 'none';
    showStatus('Extracting page content...', 'loading');

    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject content script if needed and get page content
      let pageData;
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractPageContent' });
        pageData = response;
      } catch (e) {
        // Content script not loaded, inject it
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content.js']
        });
        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 100));
        pageData = await chrome.tabs.sendMessage(tab.id, { action: 'extractPageContent' });
      }

      showStatus('Analyzing with AI...', 'loading');

      // Send to background script for processing
      chrome.runtime.sendMessage({
        action: 'processJob',
        pageData: pageData
      });

      showStatus('✓ Sent! Processing in background...', 'success');
      
      // Close popup quickly - background will show notification when done
      setTimeout(() => {
        window.close();
      }, 500);
    } catch (error) {
      showStatus(`Error: ${error.message}`, 'error');
      captureBtn.disabled = false;
    }
  });
});
