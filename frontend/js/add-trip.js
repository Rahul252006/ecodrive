let map = null;
let startMarker = null;
let endMarker = null;
let routeLine = null;
let liveCarMarker = null;
let routeCoordinates = [];

let startCoords = null;
let endCoords = null;
let clickStep = 0; // 0 = picking start, 1 = picking end

let vehiclesList = [];
let currentVehicle = null;

// Live Trip Simulation State
let isLiveTripRunning = false;
let liveTripInterval = null;
let liveSecondsElapsed = 0;
let liveTraveledKm = 0;
let liveTargetKm = 15.0;
let liveCurrentSpeed = 0;
let liveMaxSpeed = 0;
let liveIdleTimeMin = 0;
let liveHardAccels = 0;
let liveHardBrakes = 0;
let liveFuelConsumedL = 0;
let liveRouteIndex = 0;

const FUEL_PRICE_INR_PER_L = 102.0;
const ELECTRICITY_PRICE_INR_PER_KWH = 10.0;

document.addEventListener('DOMContentLoaded', async () => {
  Guards.requireAuth();
  Components.renderNavbar('trips');
  Components.renderFooter();

  const vehicleSelect = document.getElementById('vehicleId');
  const form = document.getElementById('add-trip-form');
  const errorAlert = document.getElementById('error-alert');

  // 1. Fetch User Vehicles
  try {
    const res = await API.get('/vehicles');
    vehiclesList = res.data;

    if (!vehiclesList || vehiclesList.length === 0) {
      if (errorAlert) {
        errorAlert.innerHTML = `You must add a vehicle before logging a trip. <a href="vehicles.html" style="color:var(--primary); font-weight:bold;">Add Vehicle Now &rarr;</a>`;
        errorAlert.style.display = 'block';
      }
      return;
    }

    vehicleSelect.innerHTML = vehiclesList.map(v => `
      <option value="${v._id}" ${v.defaultVehicle ? 'selected' : ''}>
        ${v.make} ${v.model} (${v.year}) - ${v.fuelType}
      </option>
    `).join('');

    const defaultVeh = vehiclesList.find(v => v.defaultVehicle) || vehiclesList[0];
    updateVehicleSpecs(defaultVeh);

    vehicleSelect.addEventListener('change', (e) => {
      const selected = vehiclesList.find(v => v._id === e.target.value);
      updateVehicleSpecs(selected);
      updateEstimatedCost();
    });
  } catch (err) {
    if (errorAlert) {
      errorAlert.textContent = err.message;
      errorAlert.style.display = 'block';
    }
  }

  // 2. Initialize Leaflet Map with CartoDB Dark Matter tiles
  initMap();

  // 3. Setup Location Search Autocomplete
  setupAutocomplete('startLocation', 'start-autocomplete', (item) => {
    setStartLocation(item.lat, item.lon, item.display_name.split(',')[0]);
  });

  setupAutocomplete('endLocation', 'end-autocomplete', (item) => {
    setEndLocation(item.lat, item.lon, item.display_name.split(',')[0]);
  });

  // 4. Listeners for Form Inputs to trigger live cost recalculation
  ['distanceKm', 'durationMin', 'idleTimeMin', 'hardAccelerationCount', 'hardBrakingCount', 'fuelConsumedL'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateEstimatedCost);
    }
  });

  // 5. Handle Manual Form Submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorAlert) errorAlert.style.display = 'none';

      const distanceKm = Number(document.getElementById('distanceKm').value);
      const durationMin = Number(document.getElementById('durationMin').value);

      if (distanceKm <= 0 || durationMin <= 0) {
        if (errorAlert) {
          errorAlert.textContent = 'Distance and duration must be greater than zero.';
          errorAlert.style.display = 'block';
        }
        return;
      }

      const payload = {
        vehicleId: document.getElementById('vehicleId').value,
        tripDate: document.getElementById('tripDate').value || new Date().toISOString(),
        startLocation: document.getElementById('startLocation').value.trim() || 'Origin',
        endLocation: document.getElementById('endLocation').value.trim() || 'Destination',
        distanceKm,
        durationMin,
        avgSpeedKmh: document.getElementById('avgSpeedKmh').value ? Number(document.getElementById('avgSpeedKmh').value) : Number((distanceKm / (durationMin / 60)).toFixed(1)),
        maxSpeedKmh: document.getElementById('maxSpeedKmh').value ? Number(document.getElementById('maxSpeedKmh').value) : Number(((distanceKm / (durationMin / 60)) * 1.25).toFixed(1)),
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

  // Load default preset (Bengaluru Indiranagar -> Whitefield)
  setPresetRoute('blr');
});

// Update vehicle specs UI
function updateVehicleSpecs(vehicle) {
  if (!vehicle) return;
  currentVehicle = vehicle;
  const isEv = vehicle.fuelType === 'EV';
  const eff = isEv 
    ? `${(100 / (vehicle.energyEfficiency || 16.0)).toFixed(1)} km/kWh` 
    : `${(100 / (vehicle.fuelEfficiency || 8.0)).toFixed(1)} km/L`;

  const effEl = document.getElementById('v-spec-eff');
  const typeEl = document.getElementById('v-spec-type');
  if (effEl) effEl.textContent = eff;
  if (typeEl) typeEl.textContent = vehicle.fuelType;
}

// ---------------- Initialize Leaflet Map with OpenStreetMap ----------------
function initMap() {
  const mapEl = document.getElementById('trip-map');
  if (!mapEl) return;

  // Fix Leaflet default marker icons when loaded from CDN
  if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });
  }

  // Default centered on Bengaluru, India
  map = L.map('trip-map', {
    zoomControl: true,
    attributionControl: true
  }).setView([12.9716, 77.5946], 12);

  // 100% Free OpenStreetMap Tile Layer (Zero API Key Required)
  const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Optional Dark CartoDB / OSM theme layer
  const osmDarkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>'
  });

  // Layer control for user convenience
  L.control.layers({
    'OpenStreetMap Standard': osmLayer,
    'OpenStreetMap Dark': osmDarkLayer
  }, null, { position: 'topright' }).addTo(map);

  // Dedicated "Locate Me" GPS button on map
  const LocateControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function() {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const btn = L.DomUtil.create('a', 'leaflet-locate-control', container);
      btn.href = '#';
      btn.title = 'Use My Current GPS Location as Origin';
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-label', 'Locate Me');
      btn.style.width = '30px';
      btn.style.height = '30px';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.background = '#0d0d16';
      btn.style.color = '#10b981';
      btn.style.border = 'none';
      btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>`;

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.preventDefault(e);
        useCurrentLocation();
      });
      return container;
    }
  });
  new LocateControl().addTo(map);

  // Click on map to drop Origin and Destination markers
  map.on('click', async (e) => {
    const { lat, lng } = e.latlng;
    if (clickStep === 0) {
      clickStep = 1;
      const name = await reverseGeocode(lat, lng) || 'Selected Origin';
      setStartLocation(lat, lng, name);
    } else {
      clickStep = 0;
      const name = await reverseGeocode(lat, lng) || 'Selected Destination';
      setEndLocation(lat, lng, name);
    }
  });
}

// Create custom colored pin for Leaflet marker
function createCustomPin(color = '#10b981', label = 'A') {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
      <div style="background:${color}; color:#fff; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(0,0,0,0.5); border:2px solid #ffffff; font-size:11px; font-weight:700;">
        ${label}
      </div>
      <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid ${color}; margin-top:-1px;"></div>
    </div>`,
    iconSize: [26, 32],
    iconAnchor: [13, 32],
    popupAnchor: [0, -32]
  });
}

// Set Start / Origin
function setStartLocation(lat, lng, name) {
  startCoords = [Number(lat), Number(lng)];
  document.getElementById('startLocation').value = name;

  if (startMarker) map.removeLayer(startMarker);
  startMarker = L.marker(startCoords, { icon: createCustomPin('#10b981', 'A') })
    .addTo(map)
    .bindPopup(`<div style="font-size:0.84rem; line-height:1.4;"><strong style="color:#10b981;">Origin (Start):</strong><br>${name}</div>`)
    .openPopup();

  if (endCoords) {
    calculateRoute();
  } else {
    map.panTo(startCoords);
  }
}

// Set Destination
function setEndLocation(lat, lng, name) {
  endCoords = [Number(lat), Number(lng)];
  document.getElementById('endLocation').value = name;

  if (endMarker) map.removeLayer(endMarker);
  endMarker = L.marker(endCoords, { icon: createCustomPin('#8b5cf6', 'B') })
    .addTo(map)
    .bindPopup(`<div style="font-size:0.84rem; line-height:1.4;"><strong style="color:#8b5cf6;">Destination:</strong><br>${name}</div>`)
    .openPopup();

  if (startCoords) {
    calculateRoute();
  } else {
    map.panTo(endCoords);
  }
}

// ---------------- Geolocation: Use Current Location ----------------
async function useCurrentLocation() {
  if (!navigator.geolocation) {
    Utils.showToast('Geolocation is not supported by your browser.', 'error');
    return;
  }

  const btn = document.getElementById('btn-use-current-location');
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Locating...`;
    btn.disabled = true;
  }

  Utils.showToast('Acquiring your current GPS location...', 'info');

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      try {
        const placeName = await reverseGeocode(lat, lng) || 'My Current Location';
        setStartLocation(lat, lng, placeName);
        map.setView([lat, lng], 14);
        Utils.showToast(`Origin set to current location: ${placeName}`, 'success');
      } catch (e) {
        setStartLocation(lat, lng, 'My Current Location');
        map.setView([lat, lng], 14);
        Utils.showToast('Origin set to current GPS coordinates.', 'success');
      } finally {
        if (btn) {
          btn.innerHTML = originalHtml;
          btn.disabled = false;
        }
      }
    },
    (err) => {
      console.warn('Geolocation error:', err);
      let errMsg = 'Unable to retrieve location.';
      if (err.code === 1) errMsg = 'Location permission denied. Please allow location access in browser settings.';
      else if (err.code === 2) errMsg = 'Position unavailable. GPS or network location could not be determined.';
      else if (err.code === 3) errMsg = 'Location request timed out.';
      Utils.showToast(errMsg, 'warning');
      if (btn) {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    }
  );
}

// ---------------- Route Calculation using Free OSRM Driving API ----------------
async function calculateRoute() {
  if (!startCoords || !endCoords) return;

  const url = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distKm = Number((route.distance / 1000).toFixed(1));
      const durMin = Math.max(1, Math.round(route.duration / 60));
      const avgSpeed = Number((distKm / (durMin / 60)).toFixed(1));
      const maxSpeed = Number((avgSpeed * 1.3).toFixed(1));

      // Draw polyline on map
      routeCoordinates = route.geometry.coordinates.map(c => [c[1], c[0]]);

      if (routeLine) map.removeLayer(routeLine);
      routeLine = L.polyline(routeCoordinates, {
        color: '#8b5cf6',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });

      // Auto-fill manual form inputs
      document.getElementById('distanceKm').value = distKm;
      document.getElementById('durationMin').value = durMin;
      document.getElementById('avgSpeedKmh').value = avgSpeed;
      document.getElementById('maxSpeedKmh').value = maxSpeed;

      // Update simulation target distance
      liveTargetKm = distKm;
      const targetDistEl = document.getElementById('live-target-dist');
      if (targetDistEl) targetDistEl.textContent = distKm.toFixed(1);

      updateEstimatedCost();
    }
  } catch (err) {
    console.warn('OSRM routing fallback used:', err);
    // Offline / Network fallback: Haversine distance
    const distKm = calculateHaversineDistance(startCoords[0], startCoords[1], endCoords[0], endCoords[1]);
    const durMin = Math.round(distKm * 2.2);

    document.getElementById('distanceKm').value = distKm;
    document.getElementById('durationMin').value = durMin;
    document.getElementById('avgSpeedKmh').value = 45;
    document.getElementById('maxSpeedKmh').value = 65;

    liveTargetKm = distKm;
    updateEstimatedCost();
  }
}

// ---------------- Live Indian Rupee Fuel Cost Estimator ----------------
function updateEstimatedCost() {
  const distKm = Number(document.getElementById('distanceKm').value) || 0;
  const durMin = Number(document.getElementById('durationMin').value) || Math.max(1, Math.round(distKm * 1.8));
  const idleMin = Number(document.getElementById('idleTimeMin')?.value) || 0;
  const accels = Number(document.getElementById('hardAccelerationCount')?.value) || 0;
  const brakes = Number(document.getElementById('hardBrakingCount')?.value) || 0;

  const isEv = currentVehicle?.fuelType === 'EV';
  const effRating = isEv 
    ? (currentVehicle?.energyEfficiency || 16.0) 
    : (currentVehicle?.fuelEfficiency || 8.0);

  // 1. Standard Catalog Estimated Consumption
  const standardConsumption = Number(((distKm * effRating) / 100).toFixed(2));
  const unitPriceInr = isEv ? ELECTRICITY_PRICE_INR_PER_KWH : FUEL_PRICE_INR_PER_L;
  const standardCostInr = Number((standardConsumption * unitPriceInr).toFixed(2));

  // Update display widgets
  const distDisplay = document.getElementById('est-dist-display');
  const timeDisplay = document.getElementById('est-time-display');
  const fuelDisplay = document.getElementById('est-fuel-display');
  const costDisplay = document.getElementById('est-cost-inr-display');

  if (distDisplay) distDisplay.textContent = `${distKm.toFixed(1)} km`;
  if (timeDisplay) timeDisplay.textContent = `${durMin} min`;
  if (fuelDisplay) fuelDisplay.textContent = isEv ? `${standardConsumption} kWh` : `${standardConsumption} L`;
  if (costDisplay) costDisplay.textContent = `₹${standardCostInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Also auto-suggest into the fuel input field if empty
  const fuelInput = document.getElementById('fuelConsumedL');
  if (fuelInput && !fuelInput.value && !isEv && standardConsumption > 0) {
    fuelInput.placeholder = `Est: ${standardConsumption} L`;
  }
}

// ---------------- Free Nominatim Geocoding & Autocomplete ----------------
function setupAutocomplete(inputId, dropdownId, onSelect) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  let debounceTimer = null;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = input.value.trim();

    if (query.length < 3) {
      dropdown.style.display = 'none';
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`;
        if (CONFIG.MAPS_API_KEY) {
          url = `https://api.locationiq.com/v1/autocomplete?key=${CONFIG.MAPS_API_KEY}&q=${encodeURIComponent(query)}&countrycodes=in&limit=5&format=json`;
        }
        const res = await fetch(url);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
          dropdown.style.display = 'none';
          return;
        }

        dropdown.innerHTML = data.map(item => `
          <div class="autocomplete-item" data-lat="${item.lat}" data-lon="${item.lon}" data-name="${item.display_name}">
            <strong>${item.display_name.split(',')[0]}</strong>
            <div style="font-size:0.75rem; color:#94a3b8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${item.display_name}
            </div>
          </div>
        `).join('');

        dropdown.style.display = 'block';

        dropdown.querySelectorAll('.autocomplete-item').forEach(el => {
          el.addEventListener('click', () => {
            const lat = el.dataset.lat;
            const lon = el.dataset.lon;
            const name = el.dataset.name.split(',')[0];
            input.value = name;
            dropdown.style.display = 'none';
            onSelect({ lat, lon, display_name: el.dataset.name });
          });
        });
      } catch (err) {
        dropdown.style.display = 'none';
      }
    }, 350);
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

async function reverseGeocode(lat, lng) {
  try {
    let url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    if (CONFIG.MAPS_API_KEY) {
      url = `https://us1.locationiq.com/v1/reverse?key=${CONFIG.MAPS_API_KEY}&lat=${lat}&lon=${lng}&format=json`;
    }
    const res = await fetch(url);
    const data = await res.json();
    return data.address ? (data.address.road || data.address.suburb || data.address.city || data.display_name.split(',')[0]) : null;
  } catch (err) {
    return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  }
}

// ---------------- Quick City Presets in India ----------------
function setPresetRoute(code) {
  const presets = {
    blr: {
      start: { lat: 12.9784, lng: 77.6408, name: 'Indiranagar, Bengaluru' },
      end: { lat: 12.9698, lng: 77.7500, name: 'Whitefield, Bengaluru' }
    },
    mum: {
      start: { lat: 19.0596, lng: 72.8295, name: 'Bandra West, Mumbai' },
      end: { lat: 18.9438, lng: 72.8231, name: 'Marine Drive, Mumbai' }
    },
    del: {
      start: { lat: 28.6304, lng: 77.2177, name: 'Connaught Place, New Delhi' },
      end: { lat: 28.4950, lng: 77.0895, name: 'Cyber Hub, Gurugram' }
    },
    hyd: {
      start: { lat: 17.4474, lng: 78.3762, name: 'Hitec City, Hyderabad' },
      end: { lat: 17.4399, lng: 78.4983, name: 'Secunderabad, Hyderabad' }
    }
  };

  const selected = presets[code] || presets.blr;
  setStartLocation(selected.start.lat, selected.start.lng, selected.start.name);
  setEndLocation(selected.end.lat, selected.end.lng, selected.end.name);
}

// ---------------- Switch UI Mode ----------------
function switchTripMode(mode) {
  const switchContainer = document.getElementById('trip-mode-switch');
  const tabMap = document.getElementById('tab-btn-map');
  const tabLive = document.getElementById('tab-btn-live');
  const panelMap = document.getElementById('panel-map-mode');
  const panelLive = document.getElementById('panel-live-mode');

  if (switchContainer) {
    switchContainer.setAttribute('data-mode', mode);
  }

  if (mode === 'live') {
    tabMap.classList.remove('active');
    tabLive.classList.add('active');
    panelMap.style.display = 'none';
    panelLive.style.display = 'block';
  } else {
    tabLive.classList.remove('active');
    tabMap.classList.add('active');
    panelLive.style.display = 'none';
    panelMap.style.display = 'block';
  }
}

// ---------------- Live Connected Vehicle Telemetry Simulation (OBD-II Demo) ----------------
function startLiveTrip() {
  if (isLiveTripRunning) return;

  // Ensure route is set
  if (!startCoords || !endCoords) {
    setPresetRoute('blr');
  }

  isLiveTripRunning = true;
  liveSecondsElapsed = 0;
  liveTraveledKm = 0;
  liveCurrentSpeed = 35;
  liveMaxSpeed = 35;
  liveIdleTimeMin = 0;
  liveHardAccels = 0;
  liveHardBrakes = 0;
  liveFuelConsumedL = 0;
  liveRouteIndex = 0;

  // Update UI State
  document.getElementById('btn-start-live-trip').style.display = 'none';
  document.getElementById('btn-finish-live-trip').style.display = 'inline-flex';
  document.getElementById('btn-abort-live-trip').style.display = 'inline-flex';

  const badge = document.getElementById('live-obd-badge');
  const badgeDot = document.getElementById('obd-status-dot');
  const badgeText = document.getElementById('obd-status-text');
  if (badge) badge.classList.add('streaming');
  if (badgeDot) badgeDot.classList.add('streaming');
  if (badgeText) {
    badgeText.textContent = 'STREAMING (10Hz CAN-BUS)';
    badgeText.style.color = '#34d399';
  }

  // Create or place live car marker on map
  const initialCoord = routeCoordinates.length > 0 ? routeCoordinates[0] : startCoords;
  if (!liveCarMarker) {
    const carIcon = L.divIcon({
      className: 'live-car-icon',
      html: '<div style="background:#8b5cf6; width:26px; height:26px; border-radius:50%; border:2px solid #ffffff; box-shadow:0 0 12px #8b5cf6; display:flex; align-items:center; justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.9 2 11.2 2 11.5V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div>',
      iconSize: [26, 26]
    });
    liveCarMarker = L.marker(initialCoord, { icon: carIcon }).addTo(map);
  } else {
    liveCarMarker.setLatLng(initialCoord);
  }

  // Ticker runs every 1 second
  liveTripInterval = setInterval(() => {
    liveSecondsElapsed += 1;

    // Simulate realistic cruising speed with slight jitter
    const speedJitter = (Math.random() - 0.45) * 4;
    liveCurrentSpeed = Math.min(95, Math.max(25, liveCurrentSpeed + speedJitter));
    liveMaxSpeed = Math.max(liveMaxSpeed, liveCurrentSpeed);

    // Increment distance based on speed
    const stepKm = (liveCurrentSpeed / 3600); // km per second
    liveTraveledKm = Math.min(liveTargetKm, liveTraveledKm + stepKm * 8); // Scaled for demo pace

    // Move car marker along route
    if (routeCoordinates.length > 0) {
      const progressPct = liveTraveledKm / Math.max(0.1, liveTargetKm);
      const coordIdx = Math.min(routeCoordinates.length - 1, Math.floor(progressPct * routeCoordinates.length));
      liveCarMarker.setLatLng(routeCoordinates[coordIdx]);
    }

    // Accumulate fuel consumption
    const isEv = currentVehicle?.fuelType === 'EV';
    const ratePerKm = isEv ? (0.16) : (0.075);
    liveFuelConsumedL = Number((liveTraveledKm * ratePerKm * (1 + 0.15 * liveHardAccels + 0.1 * liveHardBrakes)).toFixed(2));

    // Accumulate Fuel Cost in Indian Rupees (₹)
    const unitPrice = isEv ? ELECTRICITY_PRICE_INR_PER_KWH : FUEL_PRICE_INR_PER_L;
    const liveCostInr = liveFuelConsumedL * unitPrice;

    // Update Live Gauges in Cockpit
    updateLiveGauges(liveCostInr);

    // Auto-complete if target reached
    if (liveTraveledKm >= liveTargetKm) {
      finishLiveTrip();
    }
  }, 1000);
}

function updateLiveGauges(liveCostInr) {
  const speedEl = document.getElementById('live-speed-val');
  const distEl = document.getElementById('live-dist-val');
  const timerEl = document.getElementById('live-timer-val');
  const fuelEl = document.getElementById('live-fuel-val');
  const costEl = document.getElementById('live-cost-val');

  if (speedEl) speedEl.textContent = Math.round(liveCurrentSpeed);
  if (distEl) distEl.textContent = liveTraveledKm.toFixed(1);

  if (timerEl) {
    const mins = Math.floor(liveSecondsElapsed / 60);
    const secs = liveSecondsElapsed % 60;
    timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  if (fuelEl) fuelEl.textContent = liveFuelConsumedL.toFixed(2);
  if (costEl) costEl.textContent = `₹${liveCostInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Trigger simulated driving events (for presentation demo)
function triggerLiveEvent(type) {
  if (!isLiveTripRunning) {
    Utils.showToast('Start the live trip first to test vehicle events!', 'warning');
    return;
  }

  if (type === 'accel') {
    liveHardAccels += 1;
    liveCurrentSpeed = Math.min(105, liveCurrentSpeed + 28);
    liveMaxSpeed = Math.max(liveMaxSpeed, liveCurrentSpeed);
    document.getElementById('count-live-accel').textContent = liveHardAccels;
    Utils.showToast('Hard Acceleration Detected (+1 OBD-II Event)', 'warning');
  } else if (type === 'brake') {
    liveHardBrakes += 1;
    liveCurrentSpeed = Math.max(10, liveCurrentSpeed - 32);
    document.getElementById('count-live-brake').textContent = liveHardBrakes;
    Utils.showToast('Hard Braking Event Detected (+1 OBD-II Event)', 'error');
  } else if (type === 'idle') {
    liveIdleTimeMin += 1;
    liveCurrentSpeed = 0;
    document.getElementById('count-live-idle').textContent = liveIdleTimeMin;
    Utils.showToast('Vehicle Idling at Traffic Signal (+1 min)', 'warning');
  }
}

// Complete Live Connected Trip and execute ML Pipeline
async function finishLiveTrip() {
  if (!isLiveTripRunning) return;
  clearInterval(liveTripInterval);
  isLiveTripRunning = false;

  const errorAlert = document.getElementById('error-alert');
  if (errorAlert) errorAlert.style.display = 'none';

  const durationMin = Math.max(1, Math.round(liveSecondsElapsed / 60) || Math.round(liveTargetKm * 1.5));
  const avgSpeedKmh = Number((liveTraveledKm / (durationMin / 60)).toFixed(1));

  const isEv = currentVehicle?.fuelType === 'EV';

  const payload = {
    vehicleId: document.getElementById('vehicleId').value,
    tripDate: new Date().toISOString(),
    startLocation: document.getElementById('startLocation').value.trim() || 'Origin',
    endLocation: document.getElementById('endLocation').value.trim() || 'Destination',
    distanceKm: Number(Math.max(1.0, liveTraveledKm).toFixed(1)),
    durationMin,
    avgSpeedKmh: Math.max(15, avgSpeedKmh),
    maxSpeedKmh: Math.max(avgSpeedKmh + 10, Math.round(liveMaxSpeed)),
    idleTimeMin: liveIdleTimeMin,
    hardAccelerationCount: liveHardAccels,
    hardBrakingCount: liveHardBrakes,
    fuelConsumedL: !isEv ? Math.max(0.2, liveFuelConsumedL) : undefined,
    energyConsumedKwh: isEv ? Math.max(0.5, liveFuelConsumedL) : undefined
  };

  try {
    Utils.showToast('Trip finished! Running scikit-learn ML inference and EcoScore engine...');
    const res = await API.post('/trips', payload);
    if (res.success) {
      setTimeout(() => {
        window.location.href = `trip-details.html?id=${res.data.trip._id}`;
      }, 800);
    }
  } catch (err) {
    if (errorAlert) {
      errorAlert.textContent = err.message;
      errorAlert.style.display = 'block';
    }
  }
}

function abortLiveTrip() {
  if (confirm('Are you sure you want to abort the current live trip?')) {
    clearInterval(liveTripInterval);
    isLiveTripRunning = false;
    document.getElementById('btn-start-live-trip').style.display = 'inline-flex';
    document.getElementById('btn-finish-live-trip').style.display = 'none';
    document.getElementById('btn-abort-live-trip').style.display = 'none';
    const badge = document.getElementById('live-obd-badge');
    const badgeDot = document.getElementById('obd-status-dot');
    const badgeText = document.getElementById('obd-status-text');
    if (badge) badge.classList.remove('streaming');
    if (badgeDot) badgeDot.classList.remove('streaming');
    if (badgeText) {
      badgeText.textContent = 'STANDBY';
      badgeText.style.color = '';
    }
    Utils.showToast('Live trip aborted.', 'warning');
  }
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}
