document.addEventListener('DOMContentLoaded', async () => {
  Guards.requireAuth();
  Components.renderNavbar('dashboard');
  Components.renderFooter();

  const mainContainer = document.getElementById('dashboard-content');
  if (!mainContainer) return;

  try {
    mainContainer.innerHTML = Components.renderLoading('Loading driving intelligence metrics...');

    const res = await API.get('/analytics/dashboard');
    const data = res.data;

    // Check if new account with zero vehicles
    if (data.vehiclesCount === 0) {
      mainContainer.innerHTML = Components.renderEmpty(
        'Welcome to EcoDrive',
        'You have not added any vehicles to your account yet. Configure your vehicle to begin logging trips and computing ML baselines.',
        '<a href="onboarding.html" class="btn btn-primary btn-lg">Complete Onboarding &amp; Add Vehicle &rarr;</a>'
      );
      return;
    }

    // Check if account has vehicle but zero trips logged
    if (!data.hasData || data.stats.totalTrips === 0) {
      mainContainer.innerHTML = `
        <div class="page-header">
          <div class="page-title-group">
            <h1>Welcome, ${data.user.name}</h1>
            <p>Welcome to your driving cockpit. No trips have been logged yet.</p>
          </div>
          <a href="add-trip.html" class="btn btn-primary">+ Log First Trip</a>
        </div>
        ${Components.renderEmpty(
          'No Trips Logged Yet',
          'Log your first drive to start computing your 6-metric Eco Score, fuel savings, and scikit-learn ML baselines.',
          '<a href="add-trip.html" class="btn btn-primary btn-lg">+ Log First Trip &rarr;</a>'
        )}
      `;
      return;
    }

    const s = data.stats;
    const u = data.user;

    mainContainer.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Welcome back, ${u.name}</h1>
          <p>Overall Driving Efficiency &amp; Carbon Impact Cockpit</p>
        </div>
        <div style="display:flex; gap:0.75rem;">
          <a href="add-trip.html" class="btn btn-primary">+ Log New Trip</a>
        </div>
      </div>

      <!-- Quick Stats Grid -->
      <div class="grid-4" style="margin-bottom: 2rem;">
        <div class="card card-specular card-hover">
          <p class="score-label">Total Distance</p>
          <h2 style="font-size:2rem; margin-bottom:0.25rem;">${Utils.formatNumber(s.totalDistanceKm, 1)} <span style="font-size:1.1rem; color:#94a3b8; font-weight:500;">km</span></h2>
          <span style="font-size:0.8rem; color:var(--text-subtle);">Across ${s.totalTrips} logged trips</span>
        </div>
        <div class="card card-specular card-hover">
          <p class="score-label">Average Eco Score</p>
          <div style="display:flex; align-items:baseline; gap:0.5rem; margin-bottom:0.4rem;">
            <h2 style="font-size:2rem; margin:0; color:#ffffff;">${s.avgEcoScore}</h2>
            <span style="font-size:1rem; color:#94a3b8; font-family:var(--font-mono);">/ 100</span>
          </div>
          ${Utils.getCategoryBadge(s.category, s.avgEcoScore)}
        </div>
        <div class="card card-specular card-hover">
          <p class="score-label">Estimated Fuel Cost</p>
          <h2 style="font-size:2rem; margin-bottom:0.4rem; color:#ffffff;">${Utils.formatCurrency(s.totalCost)}</h2>
          ${Utils.getProvenanceBadge('calculated')}
        </div>
        <div class="card card-specular card-hover">
          <p class="score-label">Estimated CO2 Emissions</p>
          <h2 style="font-size:2rem; margin-bottom:0.4rem; color:#ffffff;">${Utils.formatNumber(s.totalCo2Kg, 1)} <span style="font-size:1.1rem; color:#94a3b8; font-weight:500;">kg</span></h2>
          ${Utils.getProvenanceBadge('estimated')}
        </div>
      </div>

      <!-- Gauge & Score Breakdown -->
      <div class="grid-2" style="margin-bottom: 2rem;">
        <div class="card card-specular">
          <div class="card-header">
            <h3>Eco Score Performance</h3>
            ${Utils.getCategoryBadge(s.category, s.avgEcoScore)}
          </div>
          <div id="dashboard-score-gauge"></div>
        </div>

        <div class="card card-specular">
          <div class="card-header">
            <h3>Score Factor Breakdown</h3>
            <span style="font-size:0.8rem; color:var(--text-muted); font-family:var(--font-mono);">6 Weighted Factors</span>
          </div>
          <div id="dashboard-score-breakdown"></div>
        </div>
      </div>

      <!-- Recent Trips Table -->
      <div class="card card-specular" style="margin-bottom: 2rem; padding:0; overflow:hidden;">
        <div class="card-header" style="padding:1.5rem 1.5rem 1rem 1.5rem; margin:0;">
          <h3 style="margin:0;">Recent Trips</h3>
          <a href="trips.html" class="btn btn-secondary btn-sm">View All Trips &rarr;</a>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Route</th>
                <th>Distance</th>
                <th>Duration</th>
                <th>Eco Score</th>
                <th>Fuel Cost</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${data.recentTrips.map(t => `
                <tr>
                  <td>${Utils.formatDate(t.tripDate)}</td>
                  <td><strong>${t.startLocation || 'Origin'}</strong> &rarr; ${t.endLocation || 'Destination'}</td>
                  <td class="mono-metric">${t.distanceKm} km</td>
                  <td class="mono-metric">${t.durationMin} min</td>
                  <td>
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                      ${Utils.getCategoryBadge(t.category, t.ecoScore)}
                      <strong style="font-family:var(--font-mono);">${t.ecoScore}</strong>
                    </div>
                  </td>
                  <td class="mono-metric">${Utils.formatCurrency(t.fuelCost)}</td>
                  <td><a href="trip-details.html?id=${t._id}" class="btn btn-secondary btn-sm" style="padding:0.35rem 0.8rem;">Details</a></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Render SVG Visualizations
    Charts.renderGauge('dashboard-score-gauge', s.avgEcoScore, s.category);
    Charts.renderBreakdownBars('dashboard-score-breakdown', s.scoreBreakdown);

  } catch (err) {
    mainContainer.innerHTML = Components.renderError(err.message, 'location.reload()');
  }
});
