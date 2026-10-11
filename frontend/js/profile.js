document.addEventListener('DOMContentLoaded', async () => {
  Guards.requireAuth();
  Components.renderNavbar('profile');
  Components.renderFooter();

  const container = document.getElementById('profile-content');
  if (!container) return;

  try {
    container.innerHTML = Components.renderLoading('Loading driver profile & achievements...');

    const res = await API.get('/user/profile');
    const u = res.data.user;
    const achievements = res.data.achievements;

    const nextLevelXp = u.level * 200;
    const currentLevelBaseXp = (u.level - 1) * 200;
    const levelProgressPct = Math.min(100, Math.round(((u.xp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100));

    container.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
        <div class="page-title-group">
          <h1>Driver Profile</h1>
          <p>Track your gamification progress, driver level, streak, and account actions.</p>
        </div>
        <div style="display:flex; align-items:center; gap:0.65rem;">
          <button onclick="Auth.logout()" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:0.45rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 2rem;">
        <div class="card card-specular">
          <div class="card-header">
            <h3>${u.name}</h3>
            <span class="pill-tag" style="background:rgba(139,92,246,0.15); border-color:#8b5cf6; color:#c084fc;">LEVEL ${u.level}</span>
          </div>
          <div style="font-size:0.92rem; display:flex; flex-direction:column; gap:0.75rem; color:#cbd5e1;">
            <div><strong>Email Address:</strong> ${u.email}</div>
            <div><strong>Primary Efficiency Goal:</strong> <span class="badge" style="background:rgba(255,255,255,0.05);">${u.goal ? u.goal.replace('_', ' ').toUpperCase() : 'SAVE FUEL'}</span></div>
            <div><strong>Active Streak:</strong> <span style="color:#fbbf24; font-weight:700;">${u.streak || 0} Days</span> <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" style="vertical-align:middle; display:inline-block; margin-left:3px;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg></div>
            <div><strong>Total Experience (XP):</strong> <strong style="color:#ffffff;">${u.xp} XP</strong></div>
            
            <div style="margin-top:0.75rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.35rem;">
                <span style="color:#94a3b8;">Level ${u.level} Progress</span>
                <span style="font-family:var(--font-mono); color:#c084fc;">${u.xp} / ${nextLevelXp} XP (${levelProgressPct}%)</span>
              </div>
              <div style="height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div style="width:${levelProgressPct}%; height:100%; background:linear-gradient(90deg, #8b5cf6, #c084fc); border-radius:4px;"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="card card-specular" style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div class="card-header">
              <h3>Account &amp; Privacy</h3>
            </div>
            <div style="font-size:0.92rem; display:flex; flex-direction:column; gap:0.75rem; color:#cbd5e1;">
              <div><strong>Public Display Name:</strong> <strong>${u.privacySettings?.displayName || u.name}</strong></div>
              <div><strong>Profile Privacy:</strong> ${u.privacySettings?.hideProfile ? 'Hidden (Anonymous)' : 'Public Cockpit'}</div>
              <div><strong>Leaderboard Status:</strong> ${u.privacySettings?.optOutLeaderboard ? 'Opted Out' : 'Active Participant'}</div>
            </div>
          </div>

          <div style="margin-top:1.5rem; padding-top:1.25rem; border-top:1px solid rgba(255,255,255,0.06); display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center;">
            <a href="settings.html" class="btn btn-secondary btn-sm" style="font-size:0.82rem;">Settings &rarr;</a>
            <button type="button" onclick="Auth.logout()" class="btn btn-secondary btn-sm" style="font-size:0.82rem; display:inline-flex; align-items:center; gap:0.4rem;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Logout
            </button>
            <button type="button" onclick="openDeleteModal()" class="btn btn-sm" style="margin-left:auto; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.35); color:#f87171; font-size:0.82rem; display:inline-flex; align-items:center; gap:0.4rem; padding:0.4rem 0.85rem; border-radius:var(--radius-full); cursor:pointer;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Delete Account
            </button>
          </div>
        </div>
      </div>

      <!-- Achievements Grid -->
      <div class="card card-specular" style="margin-bottom:2rem;">
        <div class="card-header">
          <h3 style="display:inline-flex; align-items:center; gap:0.45rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7v2h10v-2h-2c-.55 0-1-.45-1-1v-2.34c3-.87 5-3.66 5-6.66V4H5v5c0 3 2 5.79 5 6.66z"/></svg>
            Unlocked Achievements (${achievements.length})
          </h3>
        </div>
        ${achievements.length === 0 ? '<p style="color:#64748b; padding:1.5rem 0;">No achievements unlocked yet. Complete trips and challenges to earn badges!</p>' : `
          <div class="grid-3" style="gap:1rem;">
            ${achievements.map(a => `
              <div style="background:#07070c; border:1px solid rgba(255,255,255,0.06); padding:1.1rem; border-radius:14px; display:flex; gap:0.85rem; align-items:center;">
                <div style="width:40px; height:40px; border-radius:10px; background:rgba(139,92,246,0.12); border:1px solid rgba(139,92,246,0.3); color:#c084fc; display:flex; align-items:center; justify-content:center;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                </div>
                <div>
                  <h4 style="font-size:0.88rem; margin-bottom:0.2rem; color:#ffffff;">${a.title}</h4>
                  <p style="font-size:0.78rem; margin:0; color:#94a3b8;">${a.description}</p>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Confirmation Warning Modal for Deleting Account in Database -->
      <div id="delete-account-modal" style="display:none; position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); align-items:center; justify-content:center; padding:1.25rem;">
        <div class="card-specular" style="background:#0e0e18; border:1px solid rgba(239,68,68,0.35); border-radius:18px; max-width:480px; width:100%; padding:1.75rem; box-shadow:0 24px 60px rgba(0,0,0,0.9), 0 0 35px rgba(239,68,68,0.15);">
          <div style="display:flex; align-items:center; gap:0.85rem; margin-bottom:1rem;">
            <div style="width:42px; height:42px; border-radius:10px; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); display:flex; align-items:center; justify-content:center; color:#ef4444; flex-shrink:0;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h3 style="margin:0; font-size:1.18rem; color:#ffffff; font-weight:700;">Delete Account?</h3>
              <span style="font-size:0.76rem; color:#ef4444; font-weight:600; text-transform:uppercase; letter-spacing:0.04em;">Permanent Database Deletion</span>
            </div>
          </div>
          <p style="font-size:0.86rem; color:#cbd5e1; line-height:1.55; margin-bottom:1.5rem;">
            Are you sure you want to permanently delete your EcoDrive account? This action cannot be undone. All your registered vehicles, trips, efficiency scores, achievements, and leaderboard rankings will be permanently erased from the database.
          </p>
          <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="closeDeleteModal()">Cancel</button>
            <button type="button" class="btn btn-sm" id="btn-confirm-delete-account" onclick="executeDeleteAccount()" style="background:#ef4444; color:#ffffff; font-weight:600; border:none; padding:0.5rem 1.15rem; border-radius:var(--radius-full); cursor:pointer;">
              Yes, Permanently Delete My Account
            </button>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = Components.renderError(err.message, 'location.reload()');
  }
});

// Interactive modal functions for account deletion
window.openDeleteModal = function() {
  const modal = document.getElementById('delete-account-modal');
  if (modal) modal.style.display = 'flex';
};

window.closeDeleteModal = function() {
  const modal = document.getElementById('delete-account-modal');
  if (modal) modal.style.display = 'none';
};

window.executeDeleteAccount = async function() {
  const btn = document.getElementById('btn-confirm-delete-account');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Deleting from database...';
  }

  try {
    const res = await API.delete('/user/account');
    if (res.success) {
      Utils.showToast('Account permanently deleted. Logging out...', 'info');
      setTimeout(() => {
        Auth.logout();
      }, 1000);
    }
  } catch (err) {
    Utils.showToast(err.message || 'Failed to delete account.', 'error');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Yes, Permanently Delete My Account';
    }
  }
};
