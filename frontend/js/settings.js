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
    document.getElementById('fuelPriceConfig').value = u.fuelPriceConfig ?? 1.50;
    document.getElementById('electricityPriceConfig').value = u.electricityPriceConfig ?? 0.15;
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

      const payload = {
        name: document.getElementById('name').value.trim(),
        goal: document.getElementById('goal').value,
        fuelPriceConfig: Number(document.getElementById('fuelPriceConfig').value),
        electricityPriceConfig: Number(document.getElementById('electricityPriceConfig').value),
        privacySettings: {
          displayName: document.getElementById('displayName').value.trim(),
          hideProfile: document.getElementById('hideProfile').checked,
          optOutLeaderboard: document.getElementById('optOutLeaderboard').checked
        }
      };

      try {
        await API.put('/user/settings', payload);
        Utils.showToast('Settings saved successfully!');
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
