document.addEventListener('DOMContentLoaded', async () => {
  Guards.requireAuth();
  Components.renderNavbar('leaderboard');
  Components.renderFooter();

  loadLeaderboard('eco_score');

  const categorySelect = document.getElementById('leaderboard-category');
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      loadLeaderboard(e.target.value);
    });
  }
});

async function loadLeaderboard(category = 'eco_score') {
  const container = document.getElementById('leaderboard-tbody');
  if (!container) return;

  try {
    container.innerHTML = `<tr><td colspan="6" style="padding:0; border:none;">${Components.renderLoading('Loading leaderboard standings...')}</td></tr>`;

    const res = await API.get(`/leaderboard?category=${category}`);
    const list = res.data;

    if (list.length === 0) {
      container.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2.5rem; color:#64748b;">No leaderboard participants yet.</td></tr>`;
      return;
    }

    container.innerHTML = list.map(item => `
      <tr>
        <td>
          <span style="font-family:var(--font-mono); font-weight:800; font-size:1.05rem; color:${item.rank === 1 ? '#ffffff' : item.rank === 2 ? '#cbd5e1' : item.rank === 3 ? '#c084fc' : '#94a3b8'}">
            #${item.rank}
          </span>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <strong>${item.displayName}</strong>
            ${item.displayName === 'Anonymous Driver' ? '<span class="provenance-tag">private</span>' : ''}
          </div>
        </td>
        <td><span class="pill-tag" style="padding:0.2rem 0.6rem; font-size:0.75rem;">Lvl ${item.level}</span></td>
        <td><strong style="color:#ffffff; font-family:var(--font-mono);">${item.avgEcoScore}</strong> <span style="color:#94a3b8; font-size:0.8rem;">/ 100</span></td>
        <td class="mono-metric">${item.totalCo2SavedKg} kg</td>
        <td><strong style="color:#ffffff; font-family:var(--font-mono);">${item.xp} XP</strong></td>
      </tr>
    `).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2.5rem; color:var(--danger);">${err.message}</td></tr>`;
  }
}
