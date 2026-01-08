# 📋 Job Application Tracker - Chrome Extension

Automatically capture job postings and save them to Google Sheets using AI (Google Gemini).

## Features
- One-click capture from any job posting page
- AI-powered extraction of job details (company, title, location, salary, etc.)
- Automatic logging to your Google Sheet
- Works on LinkedIn, Indeed, Glassdoor, and any job site

## Quick Setup (5 minutes)

### Step 1: Get a Gemini API Key (Free)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

### Step 2: Create Your Google Sheet
1. Create a new [Google Sheet](https://sheets.google.com)
2. Add these headers in Row 1:

| Date Applied | Company | Job Title | Position Type | Location | Salary | Schedule | Experience | URL | Status | Notes |

### Step 3: Set Up the Apps Script Webhook
1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code
3. Paste this code:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  
  sheet.appendRow([
    data.dateApplied,
    data.company,
    data.jobTitle,
    data.positionType,
    data.location,
    data.salary,
    data.schedule,
    data.experienceLevel,
    data.url,
    data.status,
    data.description
  ]);
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({status: 'ok'}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Click **Deploy → New deployment**
5. Select type: **Web app**
6. Set "Who has access" to: **Anyone**
7. Click **Deploy**
8. Copy the Web app URL

### Step 4: Install the Extension
1. Download/clone this folder
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select this extension folder

### Step 5: Configure the Extension
1. Right-click the extension icon → **Options**
2. Enter your Gemini API Key
3. Enter your Apps Script Webhook URL
4. Click **Test Connection** to verify
5. Click **Save Settings**

## Usage
1. Browse to any job posting page
2. Click the extension icon in your toolbar
3. Click **"Capture This Job"**
4. Done! Check your Google Sheet

## Troubleshooting

**"Gemini API Error"**
- Make sure your API key is correct
- Check if you have API quota remaining

**"Webhook Error"**
- Ensure the Apps Script is deployed as "Anyone"
- Try redeploying the Apps Script

**Extension not extracting data correctly**
- The AI does its best, but some pages may have unusual formats
- You can always edit the data in your Google Sheet

## Files
```
job-tracker-extension/
├── manifest.json          # Extension config
├── popup/                 # Popup UI
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── content/               # Page content extraction
│   └── content.js
├── background/            # API calls & processing
│   └── background.js
├── config/                # Settings page
│   ├── config.html
│   ├── config.js
│   └── config.css
└── icons/                 # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Privacy
- Your API keys are stored locally in Chrome's secure storage
- Job data is sent only to Google's Gemini API and your own Google Sheet
- No data is collected or sent anywhere else
