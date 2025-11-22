// Background service worker for handling context menus and link flagging

const FLAG_TYPES = ['scam', 'misinformation', 'other'];

// Create context menus on installation
chrome.runtime.onInstalled.addListener(() => {
  // Parent menu for flagging links
  chrome.contextMenus.create({
    id: 'flag-link-parent',
    title: 'Flag this link',
    contexts: ['link']
  });

  // Submenu items for each flag type
  FLAG_TYPES.forEach(type => {
    chrome.contextMenus.create({
      id: `flag-link-${type}`,
      parentId: 'flag-link-parent',
      title: `As ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      contexts: ['link']
    });
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId.startsWith('flag-link-')) {
    const flagType = info.menuItemId.replace('flag-link-', '');

    // Send message to content script to show flag dialog for the link
    chrome.tabs.sendMessage(tab.id, {
      action: 'flagLink',
      linkUrl: info.linkUrl,
      flagType: flagType
    });
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'flagCurrentPage') {
    // Send response back to popup with tab info
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({ url: tabs[0].url });
      }
    });
    return true; // Keep message channel open for async response
  }
});
