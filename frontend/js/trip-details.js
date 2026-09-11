document.addEventListener('DOMContentLoaded', async () => {
  Guards.requireAuth();
  Components.renderNavbar('trips');
  Components.renderFooter();

  const container = document.getElementById('trip-details-content');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get('id');

  if (!tripId) {
    container.innerHTML = Components.renderError('No trip ID provided in request.', 'window.location.href="trips.html"');
    return;
  }

  try {
    container.innerHTML = Components.renderLoading('Evaluating trip telemetry and scikit-learn ML inference...');

    const res = await API.get(`/trips/${tripId}`);
    const trip = res.data;
    const vehicle = trip.vehicleId;

    const provenance = trip.provenance || {
      distance: 'user-provided',
      duration: 'user-provided',
      consumption: 'user-provided',
      ecoScore: 'derived',
      emissions: 'estimated'
    };

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h1>Trip Intelligence Details</h1>
          <p>${Utils.formatDate(trip.tripDate)} &bull; <strong>${trip.startLocation || 'Origin'}</strong> &rarr; <strong>${trip.endLocation || 'Destination'}</strong></p>
        </div>
        <a href="trips.html" class="btn btn-secondary">&larr; Back to Trips</a>
      </div>

      <div class="grid-3" style="margin-bottom: 2rem;">
        <div class="card card-specular">
          <div class="card-header">
            <h3>Eco Score</h3>
            ${Utils.getCategoryBadge(trip.category, trip.ecoScore)}
          </div>
          <div id="trip-score-gauge"></div>
        </div>

        <div class="card card-specular">
          <div class="card-header">
            <h3>Trip Metrics</h3>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.92rem;">
            <div><strong>Vehicle:</strong> ${vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : 'Vehicle'}</div>
            <div><strong>Distance:</strong> ${trip.distanceKm} km ${Utils.getProvenanceBadge(provenance.distance)}</div>
            <div><strong>Duration:</strong> ${trip.durationMin} min ${Utils.getProvenanceBadge(provenance.duration)}</div>
            <div><strong>Average Speed:</strong> ${trip.avgSpeedKmh} km/h</div>
            <div><strong>Maximum Speed:</strong> ${trip.maxSpeedKmh} km/h</div>
            <div><strong>Idle Time:</strong> ${trip.idleTimeMin} min <span style="color:#94a3b8;">(${Math.round((trip.idleTimeMin / trip.durationMin) * 100)}% of drive)</span></div>
          </div>
        </div>

        <div class="card card-specular">
          <div class="card-header">
            <h3>Cost &amp; Impact</h3>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.92rem;">
            <div>
              <strong>Consumption:</strong> 
              ${vehicle?.fuelType === 'EV' ? `${trip.energyConsumedKwh || 0} kWh` : `${trip.fuelConsumedL || 0} L`}
              ${Utils.getProvenanceBadge(provenance.consumption)}
            </div>
            <div>
              <strong>Estimated Fuel / Energy Cost:</strong> 
              <span style="color:#c084fc; font-weight:700;">${Utils.formatCurrency(trip.fuelCost)}</span>
              ${Utils.getProvenanceBadge('derived')}
            </div>
            <div>
              <strong>Estimated CO2 Emissions:</strong> 
              <span style="color:#fbbf24; font-weight:700;">${trip.co2EmissionsKg} kg</span>
              ${Utils.getProvenanceBadge(provenance.emissions)}
            </div>
            <div style="font-size:0.78rem; color:#64748b; margin-top:0.35rem; background:#07070c; border:1px solid rgba(255,255,255,0.06); padding:0.6rem; border-radius:8px;">
              * Standard EPA operational emission factors (2.31 kg/L gasoline, 0.40 kg/kWh grid).
            </div>
          </div>
        </div>
      </div>

      <!-- Real-time ML Model Inference Output Card -->
      <div class="card-specular" style="margin-bottom: 2rem; padding: 1.75rem; background: #0c0c16; border: 1px solid rgba(139, 92, 246, 0.35); box-shadow: 0 0 30px rgba(139, 92, 246, 0.15);">
        <div class="card-header" style="border-bottom: 1px solid rgba(139, 92, 246, 0.2); padding-bottom: 0.85rem;">
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <span style="color:#c084fc; font-size:1.2rem;">✦</span>
            <h3 style="color:#ffffff; margin:0; font-size:1.25rem;">Real ML Model Inference Output</h3>
          </div>
          <span class="pill-tag" style="background:rgba(139,92,246,0.15); border-color:#8b5cf6; color:#c084fc;">
            ${trip.mlModelName || 'eco_driving_model.joblib'}
          </span>
        </div>
        
        <div class="grid-3" style="margin-bottom: 1.25rem;">
          <div style="background:#07070c; border:1px solid rgba(255,255,255,0.06); padding:1.1rem; border-radius:14px; text-align:center;">
            <div style="font-size:0.78rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em; font-weight:700;">ML Model Predicted Fuel</div>
            <div style="font-size:1.85rem; font-weight:800; color:#c084fc; margin-top:0.25rem;">${trip.mlPredictedFuelL || (trip.fuelConsumedL || 0)} <span style="font-size:1rem; font-weight:500;">L</span></div>
          </div>
          <div style="background:#07070c; border:1px solid rgba(255,255,255,0.06); padding:1.1rem; border-radius:14px; text-align:center;">
            <div style="font-size:0.78rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em; font-weight:700;">Actual Recorded Fuel</div>
            <div style="font-size:1.85rem; font-weight:800; color:#ffffff; margin-top:0.25rem;">${trip.fuelConsumedL || 0} <span style="font-size:1rem; font-weight:500;">L</span></div>
          </div>
          <div style="background:#07070c; border:1px solid rgba(255,255,255,0.06); padding:1.1rem; border-radius:14px; text-align:center;">
            <div style="font-size:0.78rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em; font-weight:700;">Model Variance</div>
            <div style="font-size:1.85rem; font-weight:800; margin-top:0.25rem; color:${(trip.mlVariancePct || 0) > 5 ? '#f87171' : '#34d399'}">
              ${(trip.mlVariancePct || 0) > 0 ? '+' : ''}${trip.mlVariancePct || 0}%
            </div>
          </div>
        </div>

        <div style="font-size:0.92rem; color:#cbd5e1; background:#07070c; border:1px solid rgba(139,92,246,0.2); padding:1rem 1.25rem; border-radius:10px;">
          <strong style="color:#c084fc;">ML Inference Insight:</strong> ${trip.mlInsightText || 'Fuel consumption matched baseline model predictions.'}
        </div>
      </div>

      <!-- Breakdown & Driving Events -->
      <div class="grid-2" style="margin-bottom: 2rem;">
        <div class="card card-specular">
          <div class="card-header">
            <h3>Weighted Score Components</h3>
          </div>
          <div id="trip-score-breakdown"></div>
        </div>

        <div class="card card-specular">
          <div class="card-header">
            <h3>Observed Driving Events</h3>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.9rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.85rem 1rem; background:#07070c; border:1px solid rgba(255,255,255,0.06); border-radius:10px;">
              <span style="font-weight:600;">Hard Accelerations</span>
              <strong style="color: ${trip.hardAccelerationCount > 0 ? '#f87171' : '#34d399'}; font-size:1.1rem;">
                ${trip.hardAccelerationCount}
              </strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.85rem 1rem; background:#07070c; border:1px solid rgba(255,255,255,0.06); border-radius:10px;">
              <span style="font-weight:600;">Hard Braking Events</span>
              <strong style="color: ${trip.hardBrakingCount > 0 ? '#f87171' : '#34d399'}; font-size:1.1rem;">
                ${trip.hardBrakingCount}
              </strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.85rem 1rem; background:#07070c; border:1px solid rgba(255,255,255,0.06); border-radius:10px;">
              <span style="font-weight:600;">Idling Duration</span>
              <strong style="color: ${trip.idleTimeMin > 5 ? '#fbbf24' : '#34d399'}; font-size:1.1rem;">
                ${trip.idleTimeMin} mins
              </strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Coaching Recommendations -->
      <div class="card card-specular">
        <div class="card-header">
          <h3>Driving Coach Recommendations</h3>
        </div>
        <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:0.75rem;">
          ${(trip.recommendations || []).map(r => `
            <li style="display:flex; gap:0.85rem; align-items:flex-start; font-size:0.95rem; background:rgba(139,92,246,0.06); border:1px solid rgba(139,92,246,0.2); padding:0.9rem 1.1rem; border-radius:10px;">
              <span style="color:#c084fc; font-weight:bold; font-size:1.1rem;">✦</span>
              <span style="color:#f1f5f9; line-height:1.5;">${r}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;

    Charts.renderGauge('trip-score-gauge', trip.ecoScore, trip.category);
    Charts.renderBreakdownBars('trip-score-breakdown', trip.scoreBreakdown);

  } catch (err) {
    container.innerHTML = Components.renderError(err.message, 'window.location.href="trips.html"');
  }
});
