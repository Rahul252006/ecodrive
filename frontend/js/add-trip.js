document.addEventListener('DOMContentLoaded', async () => {
  Guards.requireAuth();
  Components.renderNavbar('trips');
  Components.renderFooter();

  const vehicleSelect = document.getElementById('vehicleId');
  const form = document.getElementById('add-trip-form');
  const errorAlert = document.getElementById('error-alert');

  try {
    const res = await API.get('/vehicles');
    const vehicles = res.data;

    if (vehicles.length === 0) {
      if (errorAlert) {
        errorAlert.innerHTML = `You must add a vehicle before logging a trip. <a href="vehicles.html" style="color:var(--primary); font-weight:bold;">Add Vehicle Now &rarr;</a>`;
        errorAlert.style.display = 'block';
      }
      return;
    }

    vehicleSelect.innerHTML = vehicles.map(v => `
      <option value="${v._id}" ${v.defaultVehicle ? 'selected' : ''}>
        ${v.make} ${v.model} (${v.year}) - ${v.fuelType}
      </option>
    `).join('');
  } catch (err) {
    if (errorAlert) {
      errorAlert.textContent = err.message;
      errorAlert.style.display = 'block';
    }
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorAlert) errorAlert.style.display = 'none';

      const payload = {
        vehicleId: document.getElementById('vehicleId').value,
        tripDate: document.getElementById('tripDate').value || new Date().toISOString(),
        startLocation: document.getElementById('startLocation').value.trim(),
        endLocation: document.getElementById('endLocation').value.trim(),
        distanceKm: Number(document.getElementById('distanceKm').value),
        durationMin: Number(document.getElementById('durationMin').value),
        avgSpeedKmh: document.getElementById('avgSpeedKmh').value ? Number(document.getElementById('avgSpeedKmh').value) : undefined,
        maxSpeedKmh: document.getElementById('maxSpeedKmh').value ? Number(document.getElementById('maxSpeedKmh').value) : undefined,
        idleTimeMin: document.getElementById('idleTimeMin').value ? Number(document.getElementById('idleTimeMin').value) : 0,
        hardAccelerationCount: document.getElementById('hardAccelerationCount').value ? Number(document.getElementById('hardAccelerationCount').value) : 0,
        hardBrakingCount: document.getElementById('hardBrakingCount').value ? Number(document.getElementById('hardBrakingCount').value) : 0,
        fuelConsumedL: document.getElementById('fuelConsumedL').value ? Number(document.getElementById('fuelConsumedL').value) : undefined,
        energyConsumedKwh: document.getElementById('energyConsumedKwh').value ? Number(document.getElementById('energyConsumedKwh').value) : undefined
      };

      try {
        const res = await API.post('/trips', payload);
        if (res.success) {
          Utils.showToast(`Trip logged! Awarded +${res.data.xpAwarded} XP (Level ${res.data.newLevel})`);
          window.location.href = `trip-details.html?id=${res.data.trip._id}`;
        }
      } catch (err) {
        if (errorAlert) {
          errorAlert.textContent = err.message;
          errorAlert.style.display = 'block';
        }
      }
    });
  }
});
