const CONFIG = {
  API_BASE_URL: (() => {
    // 1. Explicit window override
    if (typeof window !== 'undefined' && window.__ECODRIVE_API_URL__) {
      return window.__ECODRIVE_API_URL__;
    }
    // 2. Local storage override (for testing custom Render backend URLs)
    if (typeof localStorage !== 'undefined' && localStorage.getItem('ecodrive_api_url')) {
      return localStorage.getItem('ecodrive_api_url');
    }
    // 3. Local development
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:5000/api';
    }
    // 4. Production default (relative /api for Vercel rewrites or direct proxy)
    return '/api';
  })()
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
