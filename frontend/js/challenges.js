document.addEventListener('DOMContentLoaded', async () => {
  Guards.requireAuth();
  Components.renderNavbar('challenges');
  Components.renderFooter();

  loadChallenges();
});

async function loadChallenges() {
  const container = document.getElementById('challenges-content');
  if (!container) return;

  try {
    container.innerHTML = Components.renderLoading('Loading efficiency challenges...');

    const res = await API.get('/challenges');
    const challenges = res.data;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Efficiency Challenges</h1>
          <p>Reinforce eco-driving habits, earn XP, and level up your driver profile.</p>
        </div>
      </div>

      <div class="grid-2">
        ${challenges.map(c => {
          const pct = Math.min(100, Math.round((c.progress / c.targetValue) * 100));
          return `
            <div class="card card-specular card-hover">
              <div class="card-header">
                <h3 style="font-size:1.25rem; margin:0;">${c.title}</h3>
                <span class="pill-tag" style="background:rgba(139,92,246,0.15); border-color:#8b5cf6; color:#c084fc;">+${c.rewardXp} XP</span>
              </div>
              <p style="font-size:0.92rem; color:#94a3b8; margin-bottom:1.25rem;">${c.description}</p>
              <div style="margin-bottom:1.25rem;">
                <div style="display:flex; justify-content:space-between; font-size:0.86rem; margin-bottom:0.4rem;">
                  <span style="color:#cbd5e1;">Progress (${c.progress} / ${c.targetValue})</span>
                  <strong style="color:#c084fc; font-family:var(--font-mono);">${pct}%</strong>
                </div>
                <div style="height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                  <div style="width:${pct}%; height:100%; background:linear-gradient(90deg, #8b5cf6, #c084fc); border-radius:4px; transition:width 0.6s ease;"></div>
                </div>
              </div>
              <div>
                ${c.completed 
                  ? '<span class="badge badge-excellent">&check; COMPLETED</span>' 
                  : c.joined 
                    ? '<span class="badge badge-good">ACTIVE IN PROGRESS</span>' 
                    : `<button onclick="joinChallengeHandler('${c._id}')" class="btn btn-primary btn-sm">Join Challenge &rarr;</button>`}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = Components.renderError(err.message, 'loadChallenges()');
  }
}

async function joinChallengeHandler(id) {
  try {
    await API.post(`/challenges/${id}/join`);
    Utils.showToast('Joined challenge! Complete trips to track progress.');
    loadChallenges();
  } catch (err) {
    Utils.showToast(err.message, 'error');
  }
}
