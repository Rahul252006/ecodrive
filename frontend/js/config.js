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
    // 3. Local development environment
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:5000/api';
    }
    // 4. Production default (uses relative /api which proxies to Render via Vercel rewrites)
    return '/api';
  })()
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

