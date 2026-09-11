let activeRequests = 0;

function showGlobalLoading() {
  activeRequests++;
  let el = document.getElementById('global-api-spinner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'global-api-spinner';
    el.className = 'global-spinner-indicator';
    el.innerHTML = `<div class="mini-spinner"></div><span class="loading-text" style="font-size:0.78rem;">Loading...</span>`;
    document.body.appendChild(el);
  }
  el.classList.add('visible');
}

function hideGlobalLoading() {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    const el = document.getElementById('global-api-spinner');
    if (el) el.classList.remove('visible');
  }
}

const API = {
  async request(endpoint, options = {}) {
    showGlobalLoading();
    const token = localStorage.getItem('ecodrive_token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${CONFIG.API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error?.message || 'An error occurred while processing your request.';
        const err = new Error(errorMsg);
        err.code = data.error?.code || 'API_ERROR';
        err.status = response.status;
        throw err;
      }

      return data;
    } catch (err) {
      if (!err.status && err.message === 'Failed to fetch') {
        err.message = 'Unable to connect to the EcoDrive server. Please check your network connection.';
      }
      throw err;
    } finally {
      hideGlobalLoading();
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};
