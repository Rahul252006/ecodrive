const Auth = {
  getToken() {
    return localStorage.getItem('ecodrive_token');
  },

  setToken(token) {
    localStorage.setItem('ecodrive_token', token);
  },

  clearToken() {
    localStorage.removeItem('ecodrive_token');
    localStorage.removeItem('ecodrive_user');
  },

  getUser() {
    const raw = localStorage.getItem('ecodrive_user');
    return raw ? JSON.parse(raw) : null;
  },

  setUser(user) {
    localStorage.setItem('ecodrive_user', JSON.stringify(user));
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  async login(email, password) {
    const res = await API.post('/auth/login', { email, password });
    if (res.success && res.data?.token) {
      this.setToken(res.data.token);
      this.setUser(res.data.user);
    }
    return res;
  },

  async register(name, email, password, goal) {
    const res = await API.post('/auth/register', { name, email, password, goal });
    if (res.success && res.data?.token) {
      this.setToken(res.data.token);
      this.setUser(res.data.user);
    }
    return res;
  },

  async getCurrentUser() {
    const res = await API.get('/auth/me');
    if (res.success && res.data?.user) {
      this.setUser(res.data.user);
    }
    return res.data;
  },

  logout() {
    this.clearToken();
    window.location.href = 'login.html';
  }
};
