document.addEventListener('DOMContentLoaded', async () => {
  Guards.requireAuth();
  Components.renderNavbar('onboarding');

  const form = document.getElementById('onboarding-form');
  const errorAlert = document.getElementById('error-alert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorAlert.style.display = 'none';

      const make = document.getElementById('make').value.trim();
      const model = document.getElementById('model').value.trim();
      const year = document.getElementById('year').value;
      const fuelType = document.getElementById('fuelType').value;
      const goal = document.getElementById('goal').value;

      try {
        // 1. Update Goal
        await API.put('/user/settings', { goal });

        // 2. Add First Vehicle
        await API.post('/vehicles', {
          make,
          model,
          year,
          fuelType,
          defaultVehicle: true
        });

        Utils.showToast('Onboarding complete! Welcome to EcoDrive.');
        window.location.href = 'dashboard.html';
      } catch (err) {
        errorAlert.textContent = err.message;
        errorAlert.style.display = 'block';
      }
    });
  }
});
