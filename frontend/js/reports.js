document.addEventListener('DOMContentLoaded', async () => {
  Guards.requireAuth();
  Components.renderNavbar('reports');
  Components.renderFooter();

  const container = document.getElementById('reports-content');
  if (!container) return;

  try {
    container.innerHTML = Components.renderLoading('Generating weekly summary report...');

    const res = await API.get('/reports/weekly');
    const report = res.data;
    const cur = report.currentWeek;
    const prev = report.previousWeek;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Weekly Intelligence Report</h1>
          <p>Period: ${Utils.formatDate(report.period.startDate)} to ${Utils.formatDate(report.period.endDate)}</p>
        </div>
      </div>

      <!-- Current vs Previous Period Comparison Grid -->
      <div class="grid-4" style="margin-bottom: 2rem;">
        <div class="card card-specular">
          <p class="score-label">Trips Completed</p>
          <h2 style="font-size:2rem; margin-bottom:0.25rem;">${cur.count}</h2>
          <span style="font-size:0.8rem; color:var(--text-subtle);">Previous period: ${prev.count}</span>
        </div>
        <div class="card card-specular">
          <p class="score-label">Avg Eco Score</p>
          <h2 style="font-size:2rem; margin-bottom:0.25rem; color:#c084fc;">${cur.avgEcoScore}</h2>
          <span style="font-size:0.8rem; font-weight:700; color:${report.improvementPct >= 0 ? '#34d399' : '#f87171'}">
            ${report.improvementPct >= 0 ? '+' : ''}${report.improvementPct}% vs prior week
          </span>
        </div>
        <div class="card card-specular">
          <p class="score-label">Fuel / Energy Cost</p>
          <h2 style="font-size:2rem; margin-bottom:0.25rem;">${Utils.formatCurrency(cur.cost)}</h2>
          <span style="font-size:0.8rem; color:var(--text-subtle);">Previous period: ${Utils.formatCurrency(prev.cost)}</span>
        </div>
        <div class="card card-specular">
          <p class="score-label">Estimated CO2</p>
          <h2 style="font-size:2rem; margin-bottom:0.25rem;">${cur.co2Kg} <span style="font-size:1.1rem; color:#94a3b8; font-weight:500;">kg</span></h2>
          <span style="font-size:0.8rem; color:var(--text-subtle);">Previous period: ${prev.co2Kg} kg</span>
        </div>
      </div>

      <!-- Highlights & Weakest Trips -->
      <div class="grid-2" style="margin-bottom:2rem;">
        <div class="card card-specular">
          <div class="card-header">
            <h3 style="display:inline-flex; align-items:center; gap:0.45rem;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Best Performing Trip
            </h3>
          </div>
          ${report.bestTrip ? `
            <div style="font-size:0.92rem; display:flex; flex-direction:column; gap:0.5rem; color:#cbd5e1;">
              <div><strong>Date:</strong> ${Utils.formatDate(report.bestTrip.tripDate)}</div>
              <div><strong>Route:</strong> <strong>${report.bestTrip.startLocation}</strong> &rarr; ${report.bestTrip.endLocation}</div>
              <div><strong>Eco Score:</strong> ${Utils.getCategoryBadge(report.bestTrip.category, report.bestTrip.ecoScore)} <strong>${report.bestTrip.ecoScore}</strong></div>
              <div><a href="trip-details.html?id=${report.bestTrip._id}" class="btn btn-secondary btn-sm" style="margin-top:0.5rem;">View Trip Details &rarr;</a></div>
            </div>
          ` : '<p style="color:#64748b;">No trips logged this week.</p>'}
        </div>

        <div class="card card-specular">
          <div class="card-header">
            <h3 style="display:inline-flex; align-items:center; gap:0.45rem;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              Focus Area (Weakest Trip)
            </h3>
          </div>
          ${report.weakestTrip ? `
            <div style="font-size:0.92rem; display:flex; flex-direction:column; gap:0.5rem; color:#cbd5e1;">
              <div><strong>Date:</strong> ${Utils.formatDate(report.weakestTrip.tripDate)}</div>
              <div><strong>Route:</strong> <strong>${report.weakestTrip.startLocation}</strong> &rarr; ${report.weakestTrip.endLocation}</div>
              <div><strong>Eco Score:</strong> ${Utils.getCategoryBadge(report.weakestTrip.category, report.weakestTrip.ecoScore)} <strong>${report.weakestTrip.ecoScore}</strong></div>
              <div><a href="trip-details.html?id=${report.weakestTrip._id}" class="btn btn-secondary btn-sm" style="margin-top:0.5rem;">View Trip Details &rarr;</a></div>
            </div>
          ` : '<p style="color:#64748b;">No trips logged this week.</p>'}
        </div>
      </div>

      <!-- Recommendations -->
      <div class="card card-specular">
        <div class="card-header">
          <h3>Weekly Strategy &amp; Recommendations</h3>
        </div>
        <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:0.75rem;">
          ${(report.recommendations || []).map(r => `
            <li style="display:flex; gap:0.85rem; align-items:flex-start; background:#07070c; border:1px solid rgba(255,255,255,0.06); padding:0.9rem 1.1rem; border-radius:10px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#c084fc" style="flex-shrink:0; margin-top:3px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span style="color:#f1f5f9; line-height:1.5;">${r}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  } catch (err) {
    container.innerHTML = Components.renderError(err.message, 'location.reload()');
  }
});
