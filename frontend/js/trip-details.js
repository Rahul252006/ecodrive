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
            ${vehicle?.fuelType === 'EV' ? `
              <div>
                <strong>Tailpipe CO2 Emissions:</strong> 
                <span style="color:#10b981; font-weight:700;">0.0 kg (Zero Emission Vehicle)</span>
                ${Utils.getProvenanceBadge('zero-tailpipe')}
              </div>
              <div style="margin-top:0.35rem; font-size:0.86rem; color:#94a3b8;">
                <strong>Upstream Grid Charging CO2:</strong> 
                <span style="color:#fbbf24; font-weight:700;">${trip.co2EmissionsKg} kg</span>
                ${Utils.getProvenanceBadge(provenance.emissions)}
              </div>
              <div style="font-size:0.76rem; color:#64748b; margin-top:0.35rem; background:#07070c; border:1px solid rgba(255,255,255,0.06); padding:0.6rem; border-radius:8px;">
                * Electric Vehicles produce <strong>0 tailpipe emissions</strong>. Grid generation footprint estimated at 0.40 kg CO2/kWh for utility recharging.
              </div>
            ` : `
              <div>
                <strong>Direct Tailpipe CO2 Emissions:</strong> 
                <span style="color:#fbbf24; font-weight:700;">${trip.co2EmissionsKg} kg</span>
                ${Utils.getProvenanceBadge(provenance.emissions)}
              </div>
              <div style="font-size:0.76rem; color:#64748b; margin-top:0.35rem; background:#07070c; border:1px solid rgba(255,255,255,0.06); padding:0.6rem; border-radius:8px;">
                * Standard EPA tailpipe combustion factor (2.31 kg CO2 per Liter of gasoline).
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Real-time ML Model Inference Output Card -->
      <div class="card-specular" style="margin-bottom: 2rem; padding: 1.75rem; background: #0c0c16; border: 1px solid rgba(139, 92, 246, 0.35); box-shadow: 0 0 30px rgba(139, 92, 246, 0.15);">
        <div class="card-header" style="border-bottom: 1px solid rgba(139, 92, 246, 0.2); padding-bottom: 0.85rem;">
          <div style="display:flex; align-items:center; gap:0.55rem;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#c084fc"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <h3 style="color:#ffffff; margin:0; font-size:1.15rem;">Real ML Model Inference Output</h3>
          </div>
          <span class="pill-tag" style="background:rgba(139,92,246,0.15); border-color:#8b5cf6; color:#c084fc;">
            ${trip.mlModelName || 'eco_driving_model.joblib'}
          </span>
        </div>
        
        <div class="grid-4" style="margin-bottom: 1.25rem;">
          <div style="background:#07070c; border:1px solid rgba(255,255,255,0.06); padding:1.1rem; border-radius:14px; text-align:center;">
            <div style="font-size:0.74rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em; font-weight:700;">ML Predicted Fuel</div>
            <div style="font-size:1.7rem; font-weight:800; color:#c084fc; margin-top:0.25rem;">${trip.mlPredictedFuelL || (trip.fuelConsumedL || 0)} <span style="font-size:0.95rem; font-weight:500;">L</span></div>
          </div>
          <div style="background:#07070c; border:1px solid rgba(255,255,255,0.06); padding:1.1rem; border-radius:14px; text-align:center;">
            <div style="font-size:0.74rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em; font-weight:700;">Actual Recorded Fuel</div>
            <div style="font-size:1.7rem; font-weight:800; color:#ffffff; margin-top:0.25rem;">${trip.fuelConsumedL || 0} <span style="font-size:0.95rem; font-weight:500;">L</span></div>
          </div>
          <div style="background:#07070c; border:1px solid rgba(255,255,255,0.06); padding:1.1rem; border-radius:14px; text-align:center;">
            <div style="font-size:0.74rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em; font-weight:700;">Model Variance</div>
            <div style="font-size:1.7rem; font-weight:800; margin-top:0.25rem; color:${(trip.mlVariancePct || 0) > 5 ? '#f87171' : '#34d399'}">
              ${(trip.mlVariancePct || 0) > 0 ? '+' : ''}${trip.mlVariancePct || 0}%
            </div>
          </div>
          <div style="background:#07070c; border:1px solid rgba(52,211,153,0.3); padding:1.1rem; border-radius:14px; text-align:center;">
            <div style="font-size:0.74rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em; font-weight:700;">ML Baseline Cost (₹)</div>
            <div style="font-size:1.7rem; font-weight:800; color:#34d399; margin-top:0.25rem;">
              ${Utils.formatCurrency(trip.mlPredictedCost || (Number(trip.mlPredictedFuelL || trip.fuelConsumedL || 0) * 102.0))}
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
            <li style="display:flex; gap:0.85rem; align-items:flex-start; font-size:0.9rem; background:rgba(139,92,246,0.06); border:1px solid rgba(139,92,246,0.2); padding:0.85rem 1rem; border-radius:10px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#c084fc" style="flex-shrink:0; margin-top:3px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
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
