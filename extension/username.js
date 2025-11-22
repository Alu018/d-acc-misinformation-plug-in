// Username generator and manager
// Generates random person names and stores them in localStorage

const ADJECTIVES = [
  'Happy', 'Brave', 'Clever', 'Swift', 'Wise', 'Kind', 'Bold', 'Gentle',
  'Bright', 'Silent', 'Noble', 'Quick', 'Calm', 'Eager', 'Fair', 'Grand'
];

const ANIMALS = [
  'Panda', 'Eagle', 'Tiger', 'Dolphin', 'Fox', 'Wolf', 'Bear', 'Hawk',
  'Otter', 'Falcon', 'Lion', 'Owl', 'Deer', 'Phoenix', 'Dragon', 'Raven'
];

// Generate a random username
function generateRandomUsername() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adjective}${animal}${number}`;
}

// Initialize or get username from localStorage
async function initializeUsername() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['username'], (result) => {
      if (result.username) {
        // Username already exists, use it
        resolve(result.username);
      } else {
        // Generate new username and save it
        const newUsername = generateRandomUsername();
        chrome.storage.local.set({ username: newUsername }, () => {
          resolve(newUsername);
        });
      }
    });
  });
}

// Get current username (assumes it's already initialized)
async function getUsername() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['username'], (result) => {
      resolve(result.username || null);
    });
  });
}
