const Components = {
  renderNavbar(activePage = '', isLanding = false) {
    const user = Auth.getUser();
    const navContainer = document.getElementById('navbar-container');
    if (!navContainer) return;

    const brand = `
      <a href="index.html" class="nav-brand">
        <div class="nav-brand-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
        EcoDrive
      </a>
    `;

    if (!Auth.isAuthenticated()) {
      navContainer.innerHTML = `
        <header class="navbar-wrapper ${isLanding ? 'navbar-landing' : 'navbar-always-visible'}" id="floating-navbar">
          <nav class="navbar-pill">
            ${brand}
            <ul class="nav-links">
              <li><a href="index.html#features" class="nav-link">Features</a></li>
              <li><a href="index.html#scoring" class="nav-link">Scoring Engine</a></li>
              <li><a href="index.html#ml-model" class="nav-link">ML Baseline</a></li>
              <li><a href="index.html#provenance" class="nav-link">CO2 Audit</a></li>
              <li><a href="index.html#faq" class="nav-link">FAQ</a></li>
            </ul>
            <div class="nav-cta-group">
              <a href="login.html" class="nav-link ${activePage === 'login' ? 'active' : ''}">Sign in</a>
              <a href="register.html" class="btn btn-primary btn-sm">Get started</a>
            </div>
          </nav>
        </header>
      `;
    } else {
      navContainer.innerHTML = `
        <header class="navbar-wrapper ${isLanding ? 'navbar-landing' : 'navbar-always-visible'}" id="floating-navbar">
          <nav class="navbar-pill">
            ${brand}
            <ul class="nav-links">
              <li><a href="dashboard.html" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">Dashboard</a></li>
              <li><a href="trips.html" class="nav-link ${activePage === 'trips' ? 'active' : ''}">Trips</a></li>
              <li><a href="vehicles.html" class="nav-link ${activePage === 'vehicles' ? 'active' : ''}">Garage</a></li>
              <li><a href="challenges.html" class="nav-link ${activePage === 'challenges' ? 'active' : ''}">Challenges</a></li>
              <li><a href="leaderboard.html" class="nav-link ${activePage === 'leaderboard' ? 'active' : ''}">Leaderboard</a></li>
              <li><a href="reports.html" class="nav-link ${activePage === 'reports' ? 'active' : ''}">Reports</a></li>
            </ul>
            <div class="nav-user">
              <a href="profile.html" class="user-badge" title="Profile & Level">
                <span style="color: #c084fc; font-weight:700; font-family:var(--font-mono);">Lvl ${user?.level || 1}</span>
                <span>${user?.name || 'Driver'}</span>
              </a>
              <a href="settings.html" class="nav-link ${activePage === 'settings' ? 'active' : ''}" title="Settings" style="font-size:0.85rem;">Settings</a>
              <button onclick="Auth.logout()" class="btn btn-secondary btn-sm" style="padding:0.35rem 0.85rem;">Logout</button>
            </div>
          </nav>
        </header>
      `;
    }

    if (isLanding) {
      const handleScroll = () => {
        const nav = document.getElementById('floating-navbar');
        if (!nav) return;
        if (window.scrollY > 220) {
          nav.classList.add('navbar-visible');
        } else {
          nav.classList.remove('navbar-visible');
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }
  },

  renderFooter() {
    const footerContainer = document.getElementById('footer-container');
    if (!footerContainer) return;
    footerContainer.innerHTML = `
      <footer class="footer">
        <div class="footer-container">
          <div class="footer-grid">
            <div class="footer-brand-col">
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <div style="width:30px; height:30px; border-radius:8px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.14); display:flex; align-items:center; justify-content:center; color:#ffffff;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <span style="font-weight:800; color:#fff; font-size:1.15rem; font-family:var(--font-heading); letter-spacing:-0.02em;">EcoDrive</span>
              </div>
              <p>The consumer driving intelligence layer transforming vehicle telemetry into actionable efficiency, verified fuel predictions, and carbon savings.</p>
              <div class="footer-pill-status">
                <div class="footer-dot-live"></div>
                <span>ML Model v1.0 &bull; Operational</span>
              </div>
            </div>

            <div>
              <div class="footer-col-title">Platform</div>
              <ul class="footer-col-links">
                <li><a href="index.html#features">Features Overview</a></li>
                <li><a href="index.html#scoring">6-Factor Eco Score</a></li>
                <li><a href="index.html#ml-model">ML Baseline Engine</a></li>
                <li><a href="index.html#provenance">CO2 Emission Audit</a></li>
                <li><a href="index.html#faq">Platform FAQ</a></li>
              </ul>
            </div>

            <div>
              <div class="footer-col-title">Cockpit</div>
              <ul class="footer-col-links">
                <li><a href="dashboard.html">Telemetry Dashboard</a></li>
                <li><a href="trips.html">Trip History &amp; Audits</a></li>
                <li><a href="vehicles.html">Garage Management</a></li>
                <li><a href="challenges.html">Driver Challenges</a></li>
                <li><a href="leaderboard.html">Community Standings</a></li>
                <li><a href="reports.html">Weekly Reports</a></li>
              </ul>
            </div>

            <div>
              <div class="footer-col-title">Account</div>
              <ul class="footer-col-links">
                <li><a href="login.html">Driver Sign In</a></li>
                <li><a href="register.html">Create Free Account</a></li>
                <li><a href="settings.html">Pricing Defaults</a></li>
                <li><a href="profile.html">Gamification &amp; XP</a></li>
              </ul>
            </div>
          </div>

          <div class="footer-bottom-bar">
            <p class="footer-copy">&copy; ${new Date().getFullYear()} EcoDrive Intelligence. Engineered for sustainable driving.</p>
            <div style="display:flex; align-items:center; gap:1.5rem; font-size:0.84rem; color:#64748b;">
              <span>Privacy-First Scoring</span>
              <span>&bull;</span>
              <span>Deterministic Audits</span>
            </div>
          </div>
        </div>
      </footer>
    `;
  },

  renderLoading(message = 'Loading...') {
    return `
      <div class="loading-state">
        <div class="mini-spinner"></div>
        <span class="loading-text">${message}</span>
      </div>
    `;
  },

  renderEmpty(title = 'No Data Recorded', subtitle = 'Get started by logging your first trip or vehicle.', actionBtn = '') {
    return `
      <div class="empty-state">
        <h3 style="margin-bottom:0.4rem;">${title}</h3>
        <p style="margin-bottom:1.5rem;">${subtitle}</p>
        ${actionBtn}
      </div>
    `;
  },

  renderError(message = 'Failed to load data.', retryFn = '') {
    return `
      <div class="error-state">
        <h3 style="color: var(--danger); margin-bottom: 0.5rem;">Error</h3>
        <p>${message}</p>
        ${retryFn ? `<button onclick="${retryFn}" class="btn btn-secondary btn-sm">Retry</button>` : ''}
      </div>
    `;
  }
};
