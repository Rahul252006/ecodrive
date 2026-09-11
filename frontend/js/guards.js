const Guards = {
  requireAuth() {
    if (!Auth.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  requireGuest() {
    if (Auth.isAuthenticated()) {
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  }
};
