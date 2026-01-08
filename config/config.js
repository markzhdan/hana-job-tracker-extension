document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('config-form');
  const geminiKeyInput = document.getElementById('gemini-key');
  const webhookUrlInput = document.getElementById('webhook-url');
  const toggleKeyBtn = document.getElementById('toggle-key');
  const showInstructionsLink = document.getElementById('show-instructions');
  const instructionsDiv = document.getElementById('instructions');
  const copyScriptBtn = document.getElementById('copy-script');
  const testBtn = document.getElementById('test-btn');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  const config = await chrome.storage.sync.get(['geminiApiKey', 'webhookUrl']);
  if (config.geminiApiKey) geminiKeyInput.value = config.geminiApiKey;
  if (config.webhookUrl) webhookUrlInput.value = config.webhookUrl;

  // Toggle API key visibility
  toggleKeyBtn.addEventListener('click', () => {
    const type = geminiKeyInput.type === 'password' ? 'text' : 'password';
    geminiKeyInput.type = type;
    toggleKeyBtn.textContent = type === 'password' ? '👁️' : '🙈';
  });

  // Show/hide instructions
  showInstructionsLink.addEventListener('click', (e) => {
    e.preventDefault();
    instructionsDiv.style.display = instructionsDiv.style.display === 'none' ? 'block' : 'none';
    showInstructionsLink.textContent = instructionsDiv.style.display === 'none' 
      ? 'Show detailed instructions' : 'Hide instructions';
  });

  // Copy Apps Script code
  copyScriptBtn.addEventListener('click', () => {
    const code = document.getElementById('apps-script-code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      copyScriptBtn.textContent = '✓ Copied!';
      setTimeout(() => { copyScriptBtn.textContent = '📋 Copy Code'; }, 2000);
    });
  });

  // Show status
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
  }

  // Test connection
  testBtn.addEventListener('click', async () => {
    const apiKey = geminiKeyInput.value.trim();
    const webhookUrl = webhookUrlInput.value.trim();

    if (!apiKey || !webhookUrl) {
      showStatus('Please fill in all fields first.', 'error');
      return;
    }

    showStatus('Testing Gemini API...', 'loading');

    // Test Gemini API
    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "OK" if you can read this.' }] }]
          })
        }
      );

      if (!geminiResponse.ok) {
        const error = await geminiResponse.json();
        throw new Error(error.error?.message || 'Invalid API key');
      }

      showStatus('Gemini API OK! Testing webhook...', 'loading');
    } catch (error) {
      showStatus(`Gemini API Error: ${error.message}`, 'error');
      return;
    }

    // Test webhook (GET request)
    try {
      const webhookResponse = await fetch(webhookUrl);
      if (!webhookResponse.ok) {
        throw new Error('Webhook not accessible');
      }
      showStatus('✓ All connections working!', 'success');
    } catch (error) {
      showStatus(`Webhook Error: ${error.message}. Make sure it's deployed as "Anyone".`, 'error');
    }
  });

  // Save settings
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const apiKey = geminiKeyInput.value.trim();
    const webhookUrl = webhookUrlInput.value.trim();

    if (!apiKey || !webhookUrl) {
      showStatus('Please fill in all fields.', 'error');
      return;
    }

    await chrome.storage.sync.set({
      geminiApiKey: apiKey,
      webhookUrl: webhookUrl
    });

    showStatus('✓ Settings saved successfully!', 'success');
  });
});
