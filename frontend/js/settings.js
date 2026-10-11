document.addEventListener('DOMContentLoaded', async () => {
  Guards.requireAuth();
  Components.renderNavbar('settings');
  Components.renderFooter();

  const form = document.getElementById('settings-form');
  const alert = document.getElementById('settings-alert');

  try {
    const res = await API.get('/auth/me');
    const u = res.data.user;

    document.getElementById('name').value = u.name || '';
    document.getElementById('goal').value = u.goal || 'save_fuel';

    // Auto-heal legacy USD defaults to Indian Rupee benchmarks
    const petrolVal = (u.petrolPriceConfig && u.petrolPriceConfig >= 20) 
      ? u.petrolPriceConfig 
      : (u.fuelPriceConfig && u.fuelPriceConfig >= 20 ? u.fuelPriceConfig : 102.00);
    const dieselVal = (u.dieselPriceConfig && u.dieselPriceConfig >= 20) ? u.dieselPriceConfig : 88.00;
    const elecVal = (u.electricityPriceConfig && u.electricityPriceConfig >= 1) ? u.electricityPriceConfig : 10.00;

    const petrolEl = document.getElementById('petrolPriceConfig');
    const dieselEl = document.getElementById('dieselPriceConfig');
    const elecEl = document.getElementById('electricityPriceConfig');

    if (petrolEl) petrolEl.value = petrolVal;
    if (dieselEl) dieselEl.value = dieselVal;
    if (elecEl) elecEl.value = elecVal;

    document.getElementById('displayName').value = u.privacySettings?.displayName || '';
    document.getElementById('hideProfile').checked = !!u.privacySettings?.hideProfile;
    document.getElementById('optOutLeaderboard').checked = !!u.privacySettings?.optOutLeaderboard;
  } catch (err) {
    if (alert) {
      alert.textContent = err.message;
      alert.style.display = 'block';
    }
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (alert) alert.style.display = 'none';

      const petrolPrice = Number(document.getElementById('petrolPriceConfig')?.value) || 102.00;
      const dieselPrice = Number(document.getElementById('dieselPriceConfig')?.value) || 88.00;
      const electricityPrice = Number(document.getElementById('electricityPriceConfig')?.value) || 10.00;

      const payload = {
        name: document.getElementById('name').value.trim(),
        goal: document.getElementById('goal').value,
        petrolPriceConfig: petrolPrice,
        dieselPriceConfig: dieselPrice,
        fuelPriceConfig: petrolPrice, // legacy compatibility
        electricityPriceConfig: electricityPrice,
        privacySettings: {
          displayName: document.getElementById('displayName').value.trim(),
          hideProfile: document.getElementById('hideProfile').checked,
          optOutLeaderboard: document.getElementById('optOutLeaderboard').checked
        }
      };

      try {
        await API.put('/user/settings', payload);
        Utils.showToast('Fuel and account settings saved successfully!');
        // Update cached user
        Auth.setUser({
          ...Auth.getUser(),
          name: payload.name,
          goal: payload.goal
        });
      } catch (err) {
        if (alert) {
          alert.textContent = err.message;
          alert.style.display = 'block';
        }
      }
    });
  }
});
