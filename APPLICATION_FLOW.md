# EcoDrive — Application Flow & Execution Lifecycle

## 1. Overview & Execution Paradigm

The **EcoDrive** platform operates on an asynchronous, decoupled client-server architecture. All user interactions in the frontend initiate structured RESTful HTTP transactions communicating with the Node.js/Express backend, which coordinates specialized domain calculation services and persists state in MongoDB.

This document details the complete end-to-end runtime flows, request/response lifecycles, and data transformations from the browser UI down to the database.

---

## 2. End-to-End Request/Response Lifecycle

Every HTTP request across the platform follows a rigorous, secure path through multiple software layers:

```mermaid
sequenceDiagram
    autonumber
    actor Driver as User / Driver
    participant Browser as Browser UI (DOM)
    participant APIClient as Frontend API Client (api.js)
    participant RateLimit as Rate Limiter Middleware
    participant AuthGuard as JWT Auth Middleware
    participant Controller as Express Controller
    participant Service as Business Domain Services
    participant DB as MongoDB (Mongoose)

    Driver->>Browser: Interacts with UI (Click / Form / Sim)
    Browser->>APIClient: Calls API.get() / API.post() / API.put()
    Note over APIClient: Injects Bearer JWT token from localStorage<br/>Shows global loading spinner
    APIClient->>RateLimit: HTTP Request + Headers + JSON Body
    RateLimit->>AuthGuard: Passes rate check (< 200 req / 15 min)
    Note over AuthGuard: Decodes & verifies JWT signature<br/>Extracts req.user.id
    AuthGuard->>Controller: Invokes matching route handler
    Controller->>Service: Calls domain logic with validated DTO
    Service->>DB: Executes queries / atomic mutations
    DB-->>Service: Returns document / query results
    Service-->>Controller: Returns calculated domain DTO
    Controller-->>APIClient: Sends HTTP 200/201 JSON response
    Note over APIClient: Clears loading spinner<br/>Catches 401/429/500 errors
    APIClient-->>Browser: Resolves Promise with parsed data
    Browser->>Driver: Updates DOM / Renders Chart.js / Leaflet Maps
```

---

## 3. Primary Application Flows

### Flow 1: User Authentication & Session Lifecycle

Authentication in EcoDrive is stateless and token-based using cryptographic JSON Web Tokens (JWT).

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant LoginUI as login.html / auth.js
    participant API as Express Router (/api/auth)
    participant AuthCtrl as Auth Controller
    participant UserModel as User Mongoose Model
    participant Storage as Browser localStorage

    User->>LoginUI: Submits email & password
    LoginUI->>API: POST /api/auth/login { email, password }
    API->>AuthCtrl: login(req, res)
    AuthCtrl->>UserModel: findOne({ email }).select('+password')
    UserModel-->>AuthCtrl: User Document with password hash
    Note over AuthCtrl: bcrypt.compare(password, user.password)
    alt Password Invalid
        AuthCtrl-->>LoginUI: 401 Unauthorized { error: 'Invalid credentials' }
        LoginUI->>User: Displays error alert banner
    else Password Valid
        Note over AuthCtrl: jwt.sign({ id: user._id, email }, JWT_SECRET, { expiresIn: '7d' })
        AuthCtrl-->>LoginUI: 200 OK { token, user: { id, name, email, driverLevel, totalXp } }
        LoginUI->>Storage: setItem('ecodrive_token', token)
        LoginUI->>Storage: setItem('ecodrive_user', JSON.stringify(user))
        LoginUI->>User: Redirects to dashboard.html
    end
```

#### Route Protection Mechanism (`guards.js`):
1. When any protected page loads (`dashboard.html`, `trips.html`, `vehicles.html`, etc.), `guards.js` executes immediately in the `<head>` or initial script block.
2. If `localStorage.getItem('ecodrive_token')` is null or empty, the browser immediately redirects to `login.html`.
3. If an API request returns an HTTP `401 Unauthorized` (e.g., token expired), `api.js` automatically clears the stale token and redirects the driver to the login screen.

---

### Flow 2: Trip Ingestion & Telemetry Processing Pipeline

This is the central computational pipeline of EcoDrive. It supports both manual trip entry and real-time synthetic CAN-bus / OBD-II driving simulation.

```mermaid
sequenceDiagram
    autonumber
    actor Driver as Driver
    participant Simulator as add-trip.js (CAN-Bus Simulator)
    participant API as POST /api/trips
    participant TripCtrl as Trip Controller
    participant TripSvc as Trip Service
    participant EcoSvc as EcoScore Service
    participant FuelSvc as Fuel & Energy Service
    participant EmissSvc as Emissions Service
    participant CoachSvc as Coaching Service
    participant ChallSvc as Challenge Service
    participant DB as MongoDB

    Driver->>Simulator: Starts Live Driving Simulation
    loop Every 1 Second (CAN-Bus Tick)
        Simulator->>Simulator: Generates PIDs: Speed, RPM, Throttle%, Brake Pressure, Lateral G
        Simulator->>Simulator: Computes instantaneous fuel rate & flags hard events
    end
    Driver->>Simulator: Clicks "Complete & Save Trip"
    Simulator->>API: POST /api/trips (Distance, Duration, Events, Telemetry Array)
    API->>TripCtrl: createTrip(req, res)
    TripCtrl->>TripSvc: createTrip(userId, tripPayload)
    
    TripSvc->>DB: Finds Vehicle profile + User Fuel Rate configs
    
    par Parallel Algorithmic Processing
        TripSvc->>EcoSvc: calculateEcoScore(acceleration, braking, speed, idle, cornering)
        EcoSvc-->>TripSvc: Returns overallScore (0-100) + scoreBreakdown
    and
        TripSvc->>FuelSvc: calculateFuelAndEnergy(tripData, vehicle, userPricing)
        Note over FuelSvc: Petrol: ₹102.00/L | Diesel: ₹88.00/L | EV: ₹10.00/kWh
        FuelSvc-->>TripSvc: Returns fuelConsumedL, energyKwh, estimatedCost (₹)
    and
        TripSvc->>EmissSvc: calculateEmissions(fuelConsumed, vehicleType)
        Note over EmissSvc: Petrol: 2.31 kg/L | Diesel: 2.68 kg/L | EV: 0.71 kg/kWh
        EmissSvc-->>TripSvc: Returns co2EmissionsKg, treesSaved
    end

    TripSvc->>CoachSvc: generateCoachingTips(scoreBreakdown, tripMetrics)
    CoachSvc-->>TripSvc: Returns prioritized actionable tips

    TripSvc->>DB: Saves new Trip document
    
    TripSvc->>ChallSvc: evaluateTripChallenges(userId, savedTrip)
    Note over ChallSvc: Updates active challenges, grants XP, levels up driver
    ChallSvc->>DB: Updates UserChallenge & User XP

    TripSvc-->>TripCtrl: Returns enriched Trip document
    TripCtrl-->>Simulator: 201 Created { success: true, data: trip }
    Simulator->>Driver: Shows success toast & redirects to trip-details.html?id=...
```

---

### Flow 3: Dashboard Analytics & Aggregation Flow

When a driver opens `dashboard.html`, the application performs parallel queries to build a comprehensive real-time telematics overview.

```mermaid
sequenceDiagram
    autonumber
    actor Driver as Driver
    participant DashboardUI as dashboard.js
    participant API as GET /api/analytics/dashboard
    participant AnalyticsCtrl as Analytics Controller
    participant DB as MongoDB
    participant Charts as charts.js (Chart.js)

    Driver->>DashboardUI: Navigates to dashboard.html
    DashboardUI->>API: GET /api/analytics/dashboard
    API->>AnalyticsCtrl: getDashboardAnalytics(req, res)
    
    AnalyticsCtrl->>DB: Aggregates User Trips (Last 30 Days)
    Note over AnalyticsCtrl: Calculates: Average EcoScore,<br/>Total Distance (km), Fuel Consumed (L),<br/>Total Cost (₹), CO2 Emissions (kg),<br/>Fuel Saved vs Aggressive Baseline (₹)
    
    AnalyticsCtrl->>DB: Fetches latest 5 trips with vehicle info
    AnalyticsCtrl-->>DashboardUI: 200 OK { kpiSummary, recentTrips, scoreDistribution, monthlyTrends }
    
    DashboardUI->>DashboardUI: Injects KPI Cards (Score, Fuel Saved in ₹, CO2 Avoided)
    DashboardUI->>Charts: renderRadarChart('ecoScoreRadar', scoreDistribution)
    DashboardUI->>Charts: renderDoughnutChart('scoreDoughnut', scoreBreakdown)
    DashboardUI->>Charts: renderBarChart('monthlyTrendsChart', monthlyTrends)
    DashboardUI->>DashboardUI: Populates Recent Trips Table with dynamic status badges
```

---

### Flow 4: Trip Deep-Dive & Forensic Inspection Flow

When viewing a specific trip (`trip-details.html?id=...`), the user examines granular GPS breadcrumbs, second-by-second telematics, and personalized coaching feedback.

```mermaid
sequenceDiagram
    autonumber
    actor Driver as Driver
    participant DetailsUI as trip-details.js
    participant API as GET /api/trips/:id
    participant TripCtrl as Trip Controller
    participant DB as MongoDB
    participant Leaflet as Leaflet.js (Map Engine)
    participant ChartJS as Chart.js

    Driver->>DetailsUI: Opens trip-details.html?id=660f1b2c...
    DetailsUI->>API: GET /api/trips/660f1b2c...
    API->>TripCtrl: getTripById(req, res)
    TripCtrl->>DB: Trip.findOne({ _id: id, userId })
    DB-->>TripCtrl: Trip with telemetryPoints array
    TripCtrl-->>DetailsUI: 200 OK { trip }

    DetailsUI->>DetailsUI: Renders Header (Distance, Duration, Avg Speed, Cost in ₹)
    DetailsUI->>Leaflet: L.map('tripMap').setView([lat, lng], zoom)
    DetailsUI->>Leaflet: L.polyline(gpsCoordinates, { color: '#10b981' }).addTo(map)
    DetailsUI->>Leaflet: Plots Hard Braking / Acceleration markers along the route
    
    DetailsUI->>ChartJS: Renders Speed & Throttle profile time-series line chart
    DetailsUI->>DetailsUI: Renders Sub-Scores (Accel, Brake, Speed, Idle, Cornering)
    DetailsUI->>DetailsUI: Displays algorithmic coaching tips & suggestions
```

---

### Flow 5: Garage Management & Custom Fuel Pricing Flow

Vehicles and custom market rates can be configured to match real-world regional pricing.

```mermaid
sequenceDiagram
    autonumber
    actor Driver as Driver
    participant VehiclesUI as vehicles.html / vehicles.js
    participant SettingsUI as settings.html / settings.js
    participant API as Express Router
    participant UserCtrl as User Controller / Vehicle Controller
    participant DB as MongoDB

    rect rgb(20, 30, 45)
    Note over Driver,DB: 5A. Adding a New Vehicle to Garage
    Driver->>VehiclesUI: Selects Fuel Type: PETROL | DIESEL | ELECTRIC | HYBRID
    Driver->>VehiclesUI: Enters Make, Model, Year, Engine Size (L)
    VehiclesUI->>API: POST /api/vehicles { make, model, fuelType, engineSizeL, ... }
    API->>UserCtrl: createVehicle()
    UserCtrl->>DB: Vehicle.create()
    DB-->>UserCtrl: Vehicle saved
    UserCtrl-->>VehiclesUI: 201 Created
    VehiclesUI->>Driver: Renders new vehicle card in garage
    end

    rect rgb(25, 40, 35)
    Note over Driver,DB: 5B. Updating Regional Fuel & Energy Prices
    Driver->>SettingsUI: Updates Petrol (₹102), Diesel (₹88), Electricity (₹10)
    SettingsUI->>API: PUT /api/user/settings { petrolPriceConfig, dieselPriceConfig, electricityPriceConfig }
    API->>UserCtrl: updateSettings()
    UserCtrl->>DB: User.findByIdAndUpdate(userId, { ...pricingConfigs })
    DB-->>UserCtrl: Updated User Document
    UserCtrl-->>SettingsUI: 200 OK
    SettingsUI->>Driver: Displays "Fuel rate preferences updated successfully"
    end
```

---

### Flow 6: Gamification, Challenges & Leaderboard Progression

EcoDrive motivates drivers to adopt fuel-efficient habits through an integrated reward loop.

```mermaid
sequenceDiagram
    autonumber
    actor Driver as Driver
    participant ChallengeUI as challenges.html / challenges.js
    participant API as Express API
    participant ChallCtrl as Challenge Controller
    participant ChallSvc as Challenge Service
    participant DB as MongoDB

    Driver->>ChallengeUI: Views Available Challenges
    ChallengeUI->>API: GET /api/challenges
    API->>ChallCtrl: getChallenges(req, res)
    ChallCtrl->>DB: Challenge.find() & UserChallenge.find({ userId })
    DB-->>ChallCtrl: Challenges with user participation state
    ChallCtrl-->>ChallengeUI: 200 OK { challenges }
    
    Driver->>ChallengeUI: Clicks "Accept Challenge" (e.g. Smooth Operator - Zero Hard Brakes)
    ChallengeUI->>API: POST /api/challenges/:id/accept
    API->>ChallCtrl: acceptChallenge()
    ChallCtrl->>DB: UserChallenge.create({ userId, challengeId, status: 'ACTIVE', currentProgress: 0 })
    ChallCtrl-->>ChallengeUI: 200 OK
    
    Note over Driver,DB: Driver completes a qualifying trip via Simulator or Upload
    
    ChallSvc->>DB: Checks Trip metrics against active challenge criteria
    alt Criteria Met
        ChallSvc->>DB: Updates UserChallenge status = 'COMPLETED'
        ChallSvc->>DB: User.updateOne({ $inc: { totalXp: rewardXp } })
        Note over ChallSvc: Recalculates driverLevel = Math.floor(totalXp / 500) + 1
        ChallSvc->>DB: Records new Achievement badge
    end
```

---

### Flow 7: Error Handling, Resilience & Edge Cases

The platform guarantees graceful degradation and clear error reporting across all layers:

| Error Condition | Trigger Point | HTTP Status | System Response & User Experience |
| :--- | :--- | :--- | :--- |
| **Expired / Invalid JWT** | Client request with stale token | `401 Unauthorized` | Intercepted by `api.js`. `localStorage` cleared, user redirected to `login.html` with an explanatory toast. |
| **Rate Limit Breached** | > 200 requests in 15 minutes | `429 Too Many Requests` | Handled by `apiRateLimiter`. Client receives `{ error: { code: 'RATE_LIMIT_EXCEEDED' } }` and displays cooldown alert. |
| **Schema Validation Error** | Invalid input fields (e.g. negative distance) | `400 Bad Request` | Handled by `express-validator`. Returns exact field-level validation errors to display beneath form inputs. |
| **Database Disconnection** | MongoDB temporary drop | `503 Service Unavailable` | Backend logs error via `error.middleware.js`, returns standardized error envelope without exposing internal stack traces. |
| **Backend Server Cold Start** | Initial fetch on Render free tier | `Fetch Timeout / 502` | `api.js` catches connection timeout, shows an informative notification explaining server wake-up, and offers a retry button. |
| **Legacy Currency Fallback** | Historical trips stored in USD ($1.50) | Handled in runtime | Backend analytics controller and frontend `utils.formatCurrency` auto-convert legacy values $< ₹25$ into Indian Rupees (₹) to prevent visual artifacts. |

---

## 8. Summary of Data Transformations Across the Stack

```
[Driver Action / Sensor Input]
       ↓  (Browser Event: Click / Range Slider / Form Submit)
[Synthetic CAN-bus State]
       ↓  (PID Telemetry: Speed km/h, RPM, Throttle %, Brake Bar, Lateral G)
[Client JSON Payload]
       ↓  (POST /api/trips with JWT Bearer Token)
[Express Security & Auth Middleware]
       ↓  (Decoded req.user.id, sanitized req.body)
[Trip Service Orchestration]
       ├──> EcoScore Engine (Acceleration, Braking, Speed, Idle, Cornering → 0-100)
       ├──> Fuel & Energy Engine (Liters / kWh × ₹102 Petrol / ₹88 Diesel / ₹10 EV)
       ├──> Emissions Engine (Liters × 2.31/2.68 kg CO2 → Trees Equivalent)
       └──> Dynamic Coaching Engine (Diagnostic Rule Trees → Actionable Advice)
       ↓
[Mongoose ODM Persistence]
       ├──> Write to `trips` collection
       ├──> Update `users` collection (XP & Driver Level increment)
       └──> Update `userchallenges` collection (Progress update / Unlock)
       ↓
[Normalized REST API Response]
       ↓  ({ success: true, data: { ...trip, scoreBreakdown, costInRupees } })
[Frontend Visualization & DOM Hydration]
       ├──> Chart.js Canvas Render (Radar / Line / Doughnut / Bar)
       ├──> Leaflet.js GeoJSON Polyline & Markers
       └──> Responsive KPI Card Hydration with Indian Rupee (₹) formatting
```
