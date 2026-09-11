document.addEventListener('DOMContentLoaded', async () => {
  Guards.requireAuth();
  Components.renderNavbar('trips');
  Components.renderFooter();

  const container = document.getElementById('trips-content');
  if (!container) return;

  try {
    container.innerHTML = Components.renderLoading('Loading trip intelligence records...');

    const [tripsRes, vehiclesRes] = await Promise.all([
      API.get('/trips'),
      API.get('/vehicles')
    ]);

    const trips = tripsRes.data;
    const vehicles = vehiclesRes.data;

    if (trips.length === 0) {
      container.innerHTML = `
        <div class="page-header">
          <div class="page-title-group">
            <h1>Trip History</h1>
            <p>Track, filter, and review all recorded journeys.</p>
          </div>
          <a href="add-trip.html" class="btn btn-primary">+ Log New Trip</a>
        </div>
        ${Components.renderEmpty('No Trips Recorded', 'Start recording your journeys to analyze fuel consumption, costs, and Eco Scores.', '<a href="add-trip.html" class="btn btn-primary btn-lg">+ Log First Trip &rarr;</a>')}
      `;
      return;
    }

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Trip History</h1>
          <p>Browse, filter, and audit all your recorded journeys and ML inferences.</p>
        </div>
        <a href="add-trip.html" class="btn btn-primary">+ Log New Trip</a>
      </div>

      <div class="card card-specular" style="margin-bottom:1.5rem; padding: 1.25rem;">
        <div style="display:flex; gap:1.5rem; align-items:center; flex-wrap:wrap;">
          <div class="form-group" style="margin:0; min-width:240px;">
            <label for="vehicle-filter" style="margin-bottom:0.35rem;">Filter by Vehicle</label>
            <select id="vehicle-filter" class="form-control">
              <option value="">All Vehicles</option>
              ${vehicles.map(v => `<option value="${v._id}">${v.make} ${v.model} (${v.year})</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <div class="card card-specular" style="padding:0; overflow:hidden;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Route</th>
                <th>Distance</th>
                <th>Duration</th>
                <th>Eco Score</th>
                <th>Est. Cost</th>
                <th>Est. CO2</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="trips-tbody">
              ${renderTripsRows(trips)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Filter Listener
    const filterSelect = document.getElementById('vehicle-filter');
    filterSelect.addEventListener('change', () => {
      const selectedV = filterSelect.value;
      const filtered = selectedV ? trips.filter(t => (t.vehicleId?._id || t.vehicleId) === selectedV) : trips;
      document.getElementById('trips-tbody').innerHTML = renderTripsRows(filtered);
    });

  } catch (err) {
    container.innerHTML = Components.renderError(err.message, 'location.reload()');
  }
});

function renderTripsRows(trips) {
  if (trips.length === 0) {
    return `<tr><td colspan="9" style="text-align:center; padding:2.5rem; color:#64748b;">No trips match the selected criteria.</td></tr>`;
  }
  return trips.map(t => {
    const vName = t.vehicleId ? `${t.vehicleId.make} ${t.vehicleId.model}` : 'Vehicle';
    return `
      <tr>
        <td>${Utils.formatDate(t.tripDate)}</td>
        <td><strong>${vName}</strong></td>
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
        <td class="mono-metric">${t.co2EmissionsKg} kg</td>
        <td>
          <div style="display:flex; gap:0.5rem;">
            <a href="trip-details.html?id=${t._id}" class="btn btn-secondary btn-sm" style="padding:0.35rem 0.8rem;">Details</a>
            <button onclick="deleteTripHandler('${t._id}')" class="btn btn-danger btn-sm" style="padding:0.35rem 0.8rem;">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function deleteTripHandler(tripId) {
  if (!confirm('Are you sure you want to delete this trip record?')) return;
  try {
    await API.delete(`/trips/${tripId}`);
    Utils.showToast('Trip record deleted.');
    location.reload();
  } catch (err) {
    Utils.showToast(err.message, 'error');
  }
}
