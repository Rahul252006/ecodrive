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
      <div class="page-header">
        <div class="page-title-group">
          <h1>Driver Profile</h1>
          <p>Track your gamification progress, driver level, streak, and unlocked achievements.</p>
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
            <div><strong>Active Streak:</strong> <span style="color:#fbbf24; font-weight:700;">${u.streak || 0} Days</span> 🔥</div>
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

        <div class="card card-specular">
          <div class="card-header">
            <h3>Privacy &amp; Leaderboard Settings</h3>
          </div>
          <div style="font-size:0.92rem; display:flex; flex-direction:column; gap:0.75rem; color:#cbd5e1;">
            <div><strong>Public Display Name:</strong> <strong>${u.privacySettings?.displayName || u.name}</strong></div>
            <div><strong>Profile Privacy:</strong> ${u.privacySettings?.hideProfile ? 'Hidden (Anonymous)' : 'Public Cockpit'}</div>
            <div><strong>Leaderboard Status:</strong> ${u.privacySettings?.optOutLeaderboard ? 'Opted Out' : 'Active Participant'}</div>
            <div style="margin-top:1rem;">
              <a href="settings.html" class="btn btn-secondary btn-sm">Edit Settings &amp; Pricing &rarr;</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievements Grid -->
      <div class="card card-specular">
        <div class="card-header">
          <h3>🏆 Unlocked Achievements (${achievements.length})</h3>
        </div>
        ${achievements.length === 0 ? '<p style="color:#64748b; padding:1.5rem 0;">No achievements unlocked yet. Complete trips and challenges to earn badges!</p>' : `
          <div class="grid-3" style="gap:1rem;">
            ${achievements.map(a => `
              <div style="background:#07070c; border:1px solid rgba(255,255,255,0.06); padding:1.1rem; border-radius:14px; display:flex; gap:0.85rem; align-items:center;">
                <div style="width:44px; height:44px; border-radius:12px; background:rgba(139,92,246,0.12); border:1px solid rgba(139,92,246,0.3); color:#c084fc; display:flex; align-items:center; justify-content:center; font-size:1.3rem;">
                  🏆
                </div>
                <div>
                  <h4 style="font-size:0.95rem; margin-bottom:0.2rem; color:#ffffff;">${a.title}</h4>
                  <p style="font-size:0.82rem; margin:0; color:#94a3b8;">${a.description}</p>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  } catch (err) {
    container.innerHTML = Components.renderError(err.message, 'location.reload()');
  }
});
