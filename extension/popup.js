// Popup script

let currentConfig = null;

// Helper to build API URL (local PostgREST vs Supabase)
function buildApiUrl(baseUrl, endpoint) {
  const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
  return isLocal ? `${baseUrl}/${endpoint}` : `${baseUrl}/rest/v1/${endpoint}`;
}

// Helper to build headers (skip auth for localhost)
function buildHeaders(baseUrl, apiKey) {
  const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
  const headers = { 'Content-Type': 'application/json' };
  if (!isLocal) {
    headers['apikey'] = apiKey;
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return headers;
}

// Initialize popup
async function init() {
  currentConfig = await loadConfig();

  // Load flag count for current page
  await loadFlagCount();

  // Set up event listeners
  document.getElementById('flag-page-btn').addEventListener('click', showFlagPageModal);
  document.getElementById('refresh-btn').addEventListener('click', refreshFlags);
  document.getElementById('settings-btn').addEventListener('click', toggleSettings);
  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
  document.getElementById('modal-submit-btn').addEventListener('click', submitPageFlag);
  document.getElementById('modal-cancel-btn').addEventListener('click', hideFlagPageModal);
  
  const modeRadios = document.querySelectorAll('input[name="server-mode"]');
  modeRadios.forEach(radio => {
    radio.addEventListener('change', updateManualSettingsVisibility);
  });

  // Set initial UI state
  const serverMode = currentConfig.serverMode || 'global';
  document.querySelector(`input[name="server-mode"][value="${serverMode}"]`).checked = true;
  updateManualSettingsVisibility();

  // Load settings into form (manual settings)
  document.getElementById('supabase-url').value = currentConfig.manualSupabaseUrl || '';
  document.getElementById('supabase-key').value = currentConfig.manualSupabaseKey || '';
}

function updateManualSettingsVisibility() {
  const mode = document.querySelector('input[name="server-mode"]:checked').value;
  const manualSettings = document.getElementById('manual-settings');
  manualSettings.style.display = mode === 'manual' ? 'block' : 'none';
}

// Load config
async function loadConfig() {
  try {
    const response = await fetch(chrome.runtime.getURL('config.json'));
    const config = await response.json();

    // Check storage for mode and manual settings
    const storage = await chrome.storage.local.get(['serverMode', 'manualSupabaseUrl', 'manualSupabaseKey', 'supabaseUrl', 'supabaseKey']);
    
    const serverMode = storage.serverMode || 'global';
    config.serverMode = serverMode;
    
    // Store manual values for UI
    config.manualSupabaseUrl = storage.manualSupabaseUrl || storage.supabaseUrl || '';
    config.manualSupabaseKey = storage.manualSupabaseKey || storage.supabaseKey || '';

    // Override with manual settings if in manual mode
    if (serverMode === 'manual') {
      if (config.manualSupabaseUrl) {
        config.supabaseUrl = config.manualSupabaseUrl;
      }
      if (config.manualSupabaseKey) {
        config.supabaseKey = config.manualSupabaseKey;
      }
    }

    return config;
  } catch (error) {
    console.error('Error loading config:', error);
    // Return safe default with global assumption
    return {
      supabaseUrl: 'https://aujqbnyprthwfdqnefwc.supabase.co',
      supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1anFibnlwcnRod2ZkcW5lZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTgxMDQsImV4cCI6MjA3OTM3NDEwNH0.yUUMzCwfw4L9LOmH2vUtggNsz1QvsweR7IKfxl9_UrI', 
      serverMode: 'global'
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
    `${buildApiUrl(supabaseUrl, 'flagged_content')}?page_url=eq.${encodeURIComponent(pageUrl)}`,
    {
      headers: buildHeaders(supabaseUrl, supabaseKey)
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
  const mode = document.querySelector('input[name="server-mode"]:checked').value;
  const updates = { serverMode: mode };
  
  if (mode === 'manual') {
    const supabaseUrl = document.getElementById('supabase-url').value.trim() || 'http://localhost:3001';
    const supabaseKey = document.getElementById('supabase-key').value.trim() || 'local';
    
    updates.manualSupabaseUrl = supabaseUrl;
    updates.manualSupabaseKey = supabaseKey;
    
    // Also update legacy keys for compatibility if needed, but primarily use manual* keys
    // updates.supabaseUrl = supabaseUrl; 
    // updates.supabaseKey = supabaseKey;
    
    currentConfig.supabaseUrl = supabaseUrl;
    currentConfig.supabaseKey = supabaseKey;
    currentConfig.manualSupabaseUrl = supabaseUrl;
    currentConfig.manualSupabaseKey = supabaseKey;
  } else {
    // Global mode: Restore global config
    try {
      const response = await fetch(chrome.runtime.getURL('config.json'));
      const globalConfig = await response.json();
      currentConfig.supabaseUrl = globalConfig.supabaseUrl;
      currentConfig.supabaseKey = globalConfig.supabaseKey;
    } catch (e) {
      console.error("Failed to restore global config", e);
    }
  }

  currentConfig.serverMode = mode;

  try {
    await chrome.storage.local.set(updates);

    const btn = document.getElementById('save-settings-btn');
    btn.textContent = 'Saved!';
    btn.style.backgroundColor = '#4caf50';
    
    // Reload flags with new settings
    await loadFlagCount();

    setTimeout(() => {
      btn.textContent = 'Save Settings';
      btn.style.backgroundColor = '';
    }, 1500);
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Error saving settings');
  }
}

// Show flag page modal
async function showFlagPageModal() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url;

  document.getElementById('modal-current-url').textContent = url;
  document.getElementById('flag-page-modal').style.display = 'flex';
}

// Hide flag page modal
function hideFlagPageModal() {
  document.getElementById('flag-page-modal').style.display = 'none';
  document.getElementById('modal-note').value = '';
  document.querySelector('input[name="modal-confidence"][value="certain"]').checked = true;
}

// Submit page flag
async function submitPageFlag() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url;
  const flagType = document.getElementById('modal-flag-type').value;
  const note = document.getElementById('modal-note').value.trim();
  const confidence = document.querySelector('input[name="modal-confidence"]:checked').value;

  const flagData = {
    url: url,
    flag_type: flagType,
    confidence: confidence,
    note: note,
    flagged_by_url: url,
    created_at: new Date().toISOString()
  };

  try {
    await saveLinkFlagToDatabase(flagData);

    const btn = document.getElementById('modal-submit-btn');
    btn.textContent = 'Flagged!';
    btn.style.backgroundColor = '#4caf50';

    setTimeout(() => {
      hideFlagPageModal();
      btn.textContent = 'Flag Page';
      btn.style.backgroundColor = '';
    }, 1000);
  } catch (error) {
    console.error('Error flagging page:', error);
    alert('Error flagging page. Please try again.');
  }
}

// Save link flag to database
async function saveLinkFlagToDatabase(flagData) {
  const { supabaseUrl, supabaseKey } = currentConfig;

  const response = await fetch(buildApiUrl(supabaseUrl, 'flagged_links'), {
    method: 'POST',
    headers: {
      ...buildHeaders(supabaseUrl, supabaseKey),
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(flagData)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
