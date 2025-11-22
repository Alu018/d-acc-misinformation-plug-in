// Popup script

let currentConfig = null;

// Initialize popup
async function init() {
  currentConfig = await loadConfig();

  // Load flag count for current page
  await loadFlagCount();

  // Set up event listeners
  document.getElementById('refresh-btn').addEventListener('click', refreshFlags);
  document.getElementById('settings-btn').addEventListener('click', toggleSettings);
  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);

  // Load settings into form
  document.getElementById('supabase-url').value = currentConfig.supabaseUrl || '';
  document.getElementById('supabase-key').value = currentConfig.supabaseKey || '';
}

// Load config
async function loadConfig() {
  try {
    const response = await fetch(chrome.runtime.getURL('config.json'));
    const config = await response.json();

    // Check if user has saved custom settings
    const result = await chrome.storage.local.get(['supabaseUrl', 'supabaseKey']);
    if (result.supabaseUrl) {
      config.supabaseUrl = result.supabaseUrl;
    }
    if (result.supabaseKey) {
      config.supabaseKey = result.supabaseKey;
    }

    return config;
  } catch (error) {
    console.error('Error loading config:', error);
    return {
      supabaseUrl: 'http://localhost:54321',
      supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    };
  }
}

// Load flag count for current page
async function loadFlagCount() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    const pageUrl = url.origin + url.pathname;

    const flags = await getFlagsForPage(pageUrl);

    document.getElementById('flag-count').textContent = flags.length;

    // Display flagged items
    displayFlaggedItems(flags);
  } catch (error) {
    console.error('Error loading flag count:', error);
    document.getElementById('flag-count').textContent = '?';
  }
}

// Get flags for a page
async function getFlagsForPage(pageUrl) {
  const { supabaseUrl, supabaseKey } = currentConfig;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/flagged_content?page_url=eq.${encodeURIComponent(pageUrl)}`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Display flagged items
function displayFlaggedItems(flags) {
  const listContainer = document.getElementById('flagged-list');
  listContainer.innerHTML = '';

  if (flags.length === 0) {
    listContainer.innerHTML = '<div class="no-flags">No flags found on this page</div>';
    return;
  }

  flags.forEach(flag => {
    const item = document.createElement('div');
    item.className = 'flagged-item';

    const typeSpan = document.createElement('span');
    typeSpan.className = `flagged-item-type ${flag.flag_type}`;
    typeSpan.textContent = flag.flag_type;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'flagged-item-content';

    let displayContent = flag.content;
    if (displayContent.length > 100) {
      displayContent = displayContent.substring(0, 100) + '...';
    }
    contentDiv.textContent = displayContent;

    item.appendChild(typeSpan);
    item.appendChild(contentDiv);
    listContainer.appendChild(item);
  });
}

// Refresh flags
async function refreshFlags() {
  const btn = document.getElementById('refresh-btn');
  btn.textContent = 'Refreshing...';
  btn.disabled = true;

  try {
    // Reload the current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.reload(tab.id);

    // Update flag count
    await loadFlagCount();

    btn.textContent = 'Refreshed!';
    setTimeout(() => {
      btn.textContent = 'Refresh Flags';
      btn.disabled = false;
    }, 1500);
  } catch (error) {
    console.error('Error refreshing flags:', error);
    btn.textContent = 'Error';
    setTimeout(() => {
      btn.textContent = 'Refresh Flags';
      btn.disabled = false;
    }, 1500);
  }
}

// Toggle settings panel
function toggleSettings() {
  const panel = document.getElementById('settings-panel');
  const isVisible = panel.style.display !== 'none';
  panel.style.display = isVisible ? 'none' : 'block';

  const btn = document.getElementById('settings-btn');
  btn.textContent = isVisible ? 'Settings' : 'Hide Settings';
}

// Save settings
async function saveSettings() {
  const supabaseUrl = document.getElementById('supabase-url').value.trim();
  const supabaseKey = document.getElementById('supabase-key').value.trim();

  if (!supabaseUrl || !supabaseKey) {
    alert('Please fill in all fields');
    return;
  }

  try {
    await chrome.storage.local.set({
      supabaseUrl,
      supabaseKey
    });

    currentConfig.supabaseUrl = supabaseUrl;
    currentConfig.supabaseKey = supabaseKey;

    const btn = document.getElementById('save-settings-btn');
    btn.textContent = 'Saved!';
    btn.style.backgroundColor = '#4caf50';

    setTimeout(() => {
      btn.textContent = 'Save Settings';
      btn.style.backgroundColor = '';
    }, 1500);
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Error saving settings');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
