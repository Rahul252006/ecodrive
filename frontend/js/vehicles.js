document.addEventListener('DOMContentLoaded', async () => {
  Guards.requireAuth();
  Components.renderNavbar('vehicles');
  Components.renderFooter();

  loadVehicles();

  const form = document.getElementById('add-vehicle-form');
  const errorAlert = document.getElementById('vehicle-error-alert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorAlert) errorAlert.style.display = 'none';

      const payload = {
        make: document.getElementById('make').value.trim(),
        model: document.getElementById('model').value.trim(),
        year: Number(document.getElementById('year').value),
        fuelType: document.getElementById('fuelType').value,
        fuelEfficiency: document.getElementById('fuelEfficiency').value ? Number(document.getElementById('fuelEfficiency').value) : 8.0,
        energyEfficiency: document.getElementById('energyEfficiency').value ? Number(document.getElementById('energyEfficiency').value) : 18.0
      };

      try {
        await API.post('/vehicles', payload);
        Utils.showToast('Vehicle added to garage!');
        form.reset();
        loadVehicles();
      } catch (err) {
        if (errorAlert) {
          errorAlert.textContent = err.message;
          errorAlert.style.display = 'block';
        }
      }
    });
  }
});

async function loadVehicles() {
  const container = document.getElementById('vehicles-list');
  if (!container) return;

  try {
    container.innerHTML = Components.renderLoading('Loading your garage...');

    const res = await API.get('/vehicles');
    const vehicles = res.data;

    if (vehicles.length === 0) {
      container.innerHTML = Components.renderEmpty('Garage is Empty', 'Add your vehicle to enable trip logging and efficiency calculations.');
      return;
    }

    container.innerHTML = vehicles.map(v => `
      <div class="card card-specular card-hover">
        <div class="card-header">
          <h3 style="font-size:1.2rem; margin:0;">${v.make} ${v.model}</h3>
          ${v.defaultVehicle ? '<span class="pill-tag" style="background:rgba(139,92,246,0.15); border-color:#8b5cf6; color:#c084fc;">PRIMARY</span>' : ''}
        </div>
        <div style="font-size:0.9rem; margin-bottom:1.25rem; display:flex; flex-direction:column; gap:0.5rem; color:#cbd5e1;">
          <div><strong>Model Year:</strong> ${v.year}</div>
          <div><strong>Powertrain:</strong> <span class="badge" style="background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.1);">${v.fuelType}</span></div>
          <div>
            <strong>Efficiency Spec:</strong> 
            <span style="font-family:var(--font-mono); color:#c084fc;">${v.fuelType === 'EV' ? `${v.energyEfficiency || 18} kWh/100km` : `${v.fuelEfficiency || 8} L/100km`}</span>
          </div>
        </div>
        <div style="display:flex; gap:0.5rem;">
          ${!v.defaultVehicle ? `<button onclick="setDefaultVehicle('${v._id}')" class="btn btn-secondary btn-sm">Set Primary</button>` : ''}
          <button onclick="deleteVehicleHandler('${v._id}')" class="btn btn-danger btn-sm">Remove</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = Components.renderError(err.message, 'loadVehicles()');
  }
}

async function setDefaultVehicle(id) {
  try {
    await API.put(`/vehicles/${id}`, { defaultVehicle: true });
    Utils.showToast('Primary vehicle updated.');
    loadVehicles();
  } catch (err) {
    Utils.showToast(err.message, 'error');
  }
}

async function deleteVehicleHandler(id) {
  if (!confirm('Are you sure you want to remove this vehicle?')) return;
  try {
    await API.delete(`/vehicles/${id}`);
    Utils.showToast('Vehicle removed.');
    loadVehicles();
  } catch (err) {
    Utils.showToast(err.message, 'error');
  }
}
