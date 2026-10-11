const CONFIG = {
  API_BASE_URL: (() => {
    // 1. Explicit window environment overrides
    if (typeof window !== 'undefined' && window.__ECODRIVE_API_URL__) {
      return window.__ECODRIVE_API_URL__;
    }
    if (typeof window !== 'undefined' && window.ENV && window.ENV.API_BASE_URL) {
      return window.ENV.API_BASE_URL;
    }
    // 2. Local storage override (for custom Render backend URL testing)
    if (typeof localStorage !== 'undefined' && localStorage.getItem('ecodrive_api_url')) {
      return localStorage.getItem('ecodrive_api_url');
    }
    // 3. Local storage override (for custom backend testing)
    if (typeof localStorage !== 'undefined' && localStorage.getItem('ecodrive_api_url')) {
      return localStorage.getItem('ecodrive_api_url');
    }
    // 4. Default API URL (live Render backend)
    return 'https://ecodrive-l1rx.onrender.com/api';
  })(),

  MAPS_API_KEY: (() => {
    if (typeof window !== 'undefined' && window.__ECODRIVE_MAPS_KEY__) {
      return window.__ECODRIVE_MAPS_KEY__;
    }
    if (typeof localStorage !== 'undefined' && localStorage.getItem('ecodrive_maps_key')) {
      return localStorage.getItem('ecodrive_maps_key');
    }
    return '';
  })(),

  MAPS_PROVIDER: 'openstreetmap'
};

// Helper utility to switch Render backend URL instantly in browser
if (typeof window !== 'undefined') {
  window.setBackendUrl = (url) => {
    if (!url) {
      localStorage.removeItem('ecodrive_api_url');
      console.log('[EcoDrive] Reset backend API URL to default.');
    } else {
      localStorage.setItem('ecodrive_api_url', url);
      console.log('[EcoDrive] Backend API URL updated to:', url);
    }
    window.location.reload();
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

