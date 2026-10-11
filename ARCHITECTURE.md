# EcoDrive — System Architecture Specification

## 1. Executive Summary & Purpose

**EcoDrive** is an intelligent, fullstack connected-vehicle analytics, eco-driving scoring, and carbon reduction platform. It ingests high-frequency vehicular telemetry (CAN-bus / OBD-II data), processes multi-dimensional driving behavior, computes physics-based fuel and electrical energy consumption, quantifies carbon emissions, and provides algorithmic driver coaching with gamified incentives.

This document details the architectural topology, design patterns, technology choices, data pipelines, and computational engines that govern the EcoDrive platform.

---

## 2. High-Level System Architecture

EcoDrive utilizes a **Layered Modular N-Tier Architecture** emphasizing separation of concerns, high throughput telemetry processing, and decoupled algorithmic domain engines.

```mermaid
flowchart TB
    %% =======================================================
    %% STYLING DEFINITIONS FOR MAXIMUM LEGIBILITY
    %% =======================================================
    classDef clientStyle fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef edgeStyle fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef serverStyle fill:#1e293b,stroke:#a855f7,stroke-width:2px,color:#f8fafc;
    classDef engineStyle fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc;
    classDef dataStyle fill:#451a03,stroke:#fb923c,stroke-width:2px,color:#f8fafc;

    subgraph TIER1 ["1. CLIENT TIER (Browser Vanilla Web Stack)"]
        direction LR
        UI["HTML5 & CSS3 Glassmorphism UI"]:::clientStyle
        SIM["CAN-Bus / OBD-II Simulator"]:::clientStyle
        PAGES["Page Controllers (dashboard, trips, add-trip)"]:::clientStyle
        VIZ["Visualizations (Chart.js & Leaflet.js)"]:::clientStyle
        API_CLIENT["API Client Module (api.js + JWT Auth)"]:::clientStyle
    end

    subgraph TIER2 ["2. GATEWAY & EDGE PROXY TIER"]
        direction LR
        CDN["Static CDN (Vercel Edge Network)"]:::edgeStyle
        GATEWAY["Reverse Proxy Gateway (Render Cloud)"]:::edgeStyle
    end

    subgraph TIER3 ["3. SERVER & APPLICATION TIER (Node.js & Express)"]
        direction TB
        SECURITY["Security Stack (Helmet + CORS + Rate Limiter)"]:::serverStyle
        ROUTER["Express REST Router (/api/* endpoints)"]:::serverStyle
        AUTH_MID["JWT Authentication & Validation Middleware"]:::serverStyle
        CTRL["Controller Layer (Trip, User, Vehicle, Analytics)"]:::serverStyle
    end

    subgraph TIER4 ["4. DOMAIN & COMPUTATIONAL ENGINES"]
        direction TB
        ECO_ENG["EcoScore Scoring Engine (6 Weighted Factors)"]:::engineStyle
        FUEL_ENG["Fuel & Energy Engine (Petrol ₹102, Diesel ₹88, EV ₹10)"]:::engineStyle
        EMISS_ENG["Carbon Emissions Engine (TTW & WTW + Trees Saved)"]:::engineStyle
        COACH_ENG["Dynamic Coaching Engine (Behavioral Diagnostic)"]:::engineStyle
        ML_ENG["ML Inference Engine (VED Trained Gradient Boosting)"]:::engineStyle
        CHALL_ENG["Gamification Engine (Challenges, XP & Leaderboard)"]:::engineStyle
    end

    subgraph TIER5 ["5. PERSISTENCE LAYER (MongoDB Database Cluster)"]
        direction LR
        MONGO_DB[("MongoDB Database Replica Cluster")]:::dataStyle
        MODELS["Mongoose Schemas (User, Vehicle, Trip, Challenge, Achievement)"]:::dataStyle
    end

    UI --> PAGES
    SIM --> PAGES
    PAGES --> VIZ
    PAGES --> API_CLIENT

    API_CLIENT -->|"HTTPS / REST Request (JWT Token)"| CDN
    CDN --> GATEWAY
    GATEWAY --> SECURITY
    SECURITY --> ROUTER
    ROUTER --> AUTH_MID
    AUTH_MID --> CTRL

    CTRL --> ECO_ENG
    CTRL --> FUEL_ENG
    CTRL --> EMISS_ENG
    CTRL --> COACH_ENG
    CTRL --> ML_ENG
    CTRL --> CHALL_ENG

    CTRL --> MODELS
    ECO_ENG --> MODELS
    FUEL_ENG --> MODELS
    CHALL_ENG --> MODELS
    MODELS <-->|"Mongoose Read / Write Operations"| MONGO_DB
```

---

## 3. Technology Stack & Decision Rationale

| Layer | Technologies Selected | Architectural Justification |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5 Semantic Elements, Custom CSS3 Design System | Eliminates heavy framework overhead (React/Angular), guarantees sub-100ms first contentful paint (FCP), supports native browser performance. |
| **Frontend Styling** | Vanilla CSS3, Glassmorphism, CSS Custom Properties | Pure tokenized design system (`--bg-primary`, `--accent-teal`, `--glass-bg`). Eliminates build-step dependencies while offering modern aesthetics. |
| **Client Scripting** | Vanilla JavaScript (ES6+ Modules) | Native DOM manipulation, async/await pipelines, and modular separation (`api.js`, `charts.js`, `utils.js`). |
| **Data Visualization** | Chart.js v4.4.1 | Hardware-accelerated Canvas 2D charts (Radar, Doughnut, Multi-Axis Line, and Bar charts) for telemetry and driving behavior metrics. |
| **Geospatial Mapping** | Leaflet.js v1.9.4 & OpenStreetMap | Lightweight, open-source GPS route mapping, polyline rendering, and speed/braking heatmap overlays without proprietary map API keys. |
| **Backend Runtime** | Node.js (v18+ LTS) | Non-blocking, event-driven I/O model ideally suited for telemetry ingestion and high-concurrency API requests. |
| **Web Framework** | Express.js (v4.18.2) | Battle-tested, lightweight HTTP server framework featuring clean middleware composability. |
| **Database** | MongoDB with Mongoose ODM (v8.2.1) | Flexible JSON document model natively matching variable-length OBD-II telemetry time-series and nested driving metric structures. |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) & `bcryptjs` | Stateless, cryptographically signed Bearer authentication paired with salted key-derivation for credential storage. |
| **Security & Hardening** | `helmet`, `cors`, `express-rate-limit` | Automated HTTP response header hardening, granular origin whitelisting, and IP-level DDoS/brute-force rate limiting. |
| **Testing Suite** | Jest (v29.7.0) & Supertest (v6.3.4) | Unit testing for math/scoring engines and integration testing for all RESTful API endpoints. |

---

## 4. Architectural Layers & Separation of Concerns

### 4.1. Presentation Layer (Frontend)
- **Directory**: `/frontend`
- **Pages**:
  - `index.html`: Public product showcase, feature highlights, and telemetry demo.
  - `dashboard.html`: Command center displaying overall EcoScore, fuel saved (₹), carbon avoided, telemetry radar charts, and recent trip history.
  - `trips.html`: Paginated historical trip feed with search, filtering, and sorting.
  - `trip-details.html`: Deep-dive forensic analysis of a single trip featuring GPS route map, telemetry time-series, score breakdown, and coaching advice.
  - `add-trip.html`: Dual-mode ingestion interface offering manual form entry or a real-time CAN-bus / OBD-II synthetic driving simulator.
  - `vehicles.html`: Fleet and garage management (Petrol, Diesel, Hybrid, and EV profiles).
  - `challenges.html`: Gamification hub displaying active driver challenges, XP progress, and badges.
  - `leaderboard.html`: Global and vehicle-class eco-driver rankings.
  - `reports.html`: Weekly driving performance audits with exportable summaries.
  - `settings.html`: User preferences and fuel rate configurations (Petrol ₹/L, Diesel ₹/L, Electricity ₹/kWh).
- **Core Scripts**:
  - `api.js`: Unified HTTP abstraction with automatic authorization headers, global request counter, loading spinner, and 401 interceptors.
  - `components.js`: Dynamic injection of standardized navigation headers, footers, and active session indicators across all pages.
  - `guards.js`: Client-side route protection redirecting unauthenticated users to `login.html`.
  - `charts.js`: Chart.js factory generating radar behavior graphs, efficiency doughnuts, and speed profiles.

### 4.2. API & Controller Layer (Backend)
- **Directory**: `/backend/controllers` & `/backend/routes`
- **Responsibilities**:
  - Translates incoming HTTP requests into service-layer domain calls.
  - Enforces schema validation using `express-validator` and custom validation rules.
  - Extracts authenticated user context (`req.user.id`) from verified JWT tokens.
  - Formats uniform JSON API responses (`{ success: true, data: ... }` or `{ success: false, error: ... }`).
  - Shields business logic from HTTP transport specifics.

### 4.3. Business & Algorithmic Domain Services Layer
- **Directory**: `/backend/services`
- **Design Pattern**: Service Layer Pattern isolating pure calculation logic from database models.

```mermaid
classDiagram
    class TripService {
        +createTrip(userId, tripData)
        +getUserTrips(userId, query)
        +getTripById(userId, tripId)
        +deleteTrip(userId, tripId)
    }

    class EcoScoreService {
        +calculateEcoScore(metrics)
        -calculateAccelerationScore()
        -calculateBrakingScore()
        -calculateSpeedConsistencyScore()
        -calculateIdlingScore()
        -calculateCorneringScore()
    }

    class FuelService {
        +calculateFuelAndEnergy(tripData, vehicle, userSettings)
        -calculatePetrolConsumption()
        -calculateDieselConsumption()
        -calculateElectricConsumption()
    }

    class EmissionsService {
        +calculateEmissions(fuelResult, vehicleType)
        +calculateTreesEquivalent(savedCo2Kg)
    }

    class CoachingService {
        +generateCoachingTips(scoreBreakdown, tripMetrics)
    }

    class ChallengeService {
        +evaluateTripChallenges(userId, trip)
        +getActiveChallenges(userId)
        +claimReward(userId, challengeId)
    }

    TripService --> EcoScoreService : delegates scoring
    TripService --> FuelService : delegates fuel/cost
    TripService --> EmissionsService : delegates CO2
    TripService --> CoachingService : delegates feedback
    TripService --> ChallengeService : checks progression
```

### 4.4. Persistence & Data Access Layer
- **Directory**: `/backend/models`
- **Engine**: Mongoose ODM with MongoDB.
- Employs strict schema definitions, compound indexes for rapid query execution, pre-save hooks (e.g., password hashing), and virtual properties.

---

## 5. Algorithmic Domain Engines

### 5.1. EcoScore Engine (`ecoScore.service.js`)
The EcoScore is a normalized index ($0 - 100$) derived from five weighted telemetry factors:

$$\text{EcoScore} = 0.25 S_{\text{accel}} + 0.25 S_{\text{brake}} + 0.20 S_{\text{speed}} + 0.15 S_{\text{idle}} + 0.15 S_{\text{corner}}$$

1. **Acceleration Score ($S_{\text{accel}}$, 25% weight)**:
   - Evaluates rapid throttle applications and acceleration spikes ($> 0.3g$ / $> 3.0\text{ m/s}^2$).
   - Penalty: $5 \times \text{hardAccelerationEvents}$.
2. **Braking Score ($S_{\text{brake}}$, 25% weight)**:
   - Measures kinetic energy loss from severe deceleration ($< -0.3g$ / $< -3.0\text{ m/s}^2$).
   - Penalty: $6 \times \text{hardBrakingEvents}$.
3. **Speed Consistency ($S_{\text{speed}}$, 20% weight)**:
   - Evaluates cruising efficiency. Penalties applied for sustained speeding over $100\text{ km/h}$ or erratic velocity fluctuation.
4. **Idling Efficiency ($S_{\text{idle}}$, 15% weight)**:
   - Quantifies fuel wasted while stationary with engine running. Penalizes idle duration exceeding 5% of total trip time.
5. **Cornering / Lateral G-Force ($S_{\text{corner}}$, 15% weight)**:
   - Evaluates lateral stability and tire scrub during turns ($> 0.35g$ lateral acceleration).

### 5.2. Fuel & Energy Calculation Engine (`fuel.service.js`)
Computes precise fuel consumption and financial cost based on vehicle powertrain and latest localized market rates:

- **Configured Market Baseline Rates**:
  - **Petrol**: ₹102.00 / Liter
  - **Diesel**: ₹88.00 / Liter
  - **Electricity (EV)**: ₹10.00 / kWh
- **Internal Combustion (ICE) Formula**:
  $$\text{Fuel Consumed (L)} = \frac{\text{Distance (km)} \times \text{Baseline L/100km}}{100} \times \left(1 + \frac{100 - \text{EcoScore}}{200}\right)$$
  $$\text{Trip Cost (₹)} = \text{Fuel Consumed (L)} \times \text{Fuel Rate (₹/L)}$$
- **Electric Vehicle (EV) Formula**:
  $$\text{Energy Consumed (kWh)} = \frac{\text{Distance (km)} \times \text{Rated kWh/100km}}{100} \times \left(1 + \frac{100 - \text{EcoScore}}{250}\right) - \text{Regenerative Energy}$$
  $$\text{Trip Cost (₹)} = \text{Energy Consumed (kWh)} \times \text{Electricity Rate (₹/kWh)}$$

### 5.3. Carbon Emissions Engine (`emissions.service.js`)
Quantifies Tank-to-Wheel (TTW) direct emissions and Well-to-Wheel (WTW) lifecycle impact:
- **Emission Factors**:
  - Petrol: $2.31\text{ kg CO}_2 / \text{Liter}$
  - Diesel: $2.68\text{ kg CO}_2 / \text{Liter}$
  - Electric Grid Average: $0.71\text{ kg CO}_2 / \text{kWh}$ (National Grid Carbon Intensity)
- **Carbon Offset Equivalencies**:
  - 1 Mature Urban Tree absorbs approximately $21.77\text{ kg CO}_2$ per year ($0.0596\text{ kg CO}_2 / \text{day}$).
  $$\text{Trees Equivalent} = \frac{\text{CO}_2 \text{ Saved (kg)}}{21.77}$$

### 5.4. Dynamic Coaching Engine (`coaching.service.js`)
Performs algorithmic diagnosis of driver telematics:
- Identifies the lowest sub-score factor.
- Evaluates specific event density (e.g., hard stops per 10 km).
- Synthesizes contextual, prioritized recommendations (e.g., *"Anticipate traffic lights 100m earlier to reduce hard braking and capture regenerative energy"*).

---

## 6. Database Architecture & Schema Design

```mermaid
erDiagram
    USER ||--o{ VEHICLE : owns
    USER ||--o{ TRIP : records
    USER ||--o{ USER_CHALLENGE : participates
    USER ||--o{ ACHIEVEMENT : unlocks
    USER ||--o{ WEEKLY_REPORT : receives
    VEHICLE ||--o{ TRIP : used_in
    CHALLENGE ||--o{ USER_CHALLENGE : instantiates

    USER {
        ObjectId _id PK
        string email UK
        string password
        string name
        int totalXp
        int driverLevel
        number petrolPriceConfig
        number dieselPriceConfig
        number electricityPriceConfig
        date createdAt
    }

    VEHICLE {
        ObjectId _id PK
        ObjectId userId FK
        string make
        string model
        int year
        string fuelType "PETROL | DIESEL | ELECTRIC | HYBRID"
        number engineSizeL
        number baselineLPer100km
        number baselineKwhPer100km
        boolean isDefault
    }

    TRIP {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId vehicleId FK
        string tripName
        date startTime
        date endTime
        number distanceKm
        number durationMinutes
        number averageSpeedKmH
        number maxSpeedKmH
        number idleMinutes
        int hardBrakingEvents
        int hardAccelerationEvents
        number ecoScore
        json scoreBreakdown
        number fuelConsumedLiters
        number energyConsumedKwh
        number estimatedCost
        number co2EmissionsKg
        array telemetryPoints
    }

    CHALLENGE {
        ObjectId _id PK
        string title
        string description
        string category "SAFETY | FUEL_SAVING | ECO_DRIVING | STREAK"
        string targetMetric
        number targetValue
        int rewardXp
        int durationDays
    }

    USER_CHALLENGE {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId challengeId FK
        string status "ACTIVE | COMPLETED | EXPIRED"
        number currentProgress
        date startDate
        date completedDate
    }
```

### Critical Database Indexing Strategy
To maintain sub-15ms response times across analytics and dashboard queries:
- `Trip`: `{ userId: 1, startTime: -1 }` (Compound index powering dashboard metrics and trip history pagination).
- `Trip`: `{ vehicleId: 1 }` (Vehicle efficiency benchmarking).
- `User`: `{ email: 1 }` (Unique index for high-speed authentication).
- `UserChallenge`: `{ userId: 1, status: 1 }` (Active challenge lookup).
- `Vehicle`: `{ userId: 1, isDefault: 1 }` (Quick retrieval of primary active vehicle).

---

## 7. Security Architecture & Threat Mitigation

1. **Authentication & Session Lifecycle**:
   - Stateless JSON Web Tokens (JWT) signed using HMAC-SHA256 (`JWT_SECRET`).
   - Tokens contain non-sensitive payload claims (`id`, `email`) with configurable expiry (`7d`).
   - Passwords hashed using `bcryptjs` with salt round cost factor 10.
2. **HTTP Hardening & Network Defense**:
   - **Helmet**: Enforces Strict-Transport-Security (HSTS), X-Content-Type-Options (`nosniff`), X-Frame-Options (`SAMEORIGIN`), and Content Security Policy basics.
   - **CORS Policy**: Dynamic origin validation whitelist allowing local development servers (`localhost:3000`, `localhost:5000`) and production deployment domains (`*.vercel.app`).
   - **Rate Limiting**: Sliding-window rate limiter restricting IP addresses to a max of 200 API requests per 15 minutes, neutralizing brute-force and credential-stuffing attacks.
3. **Data Validation & Sanitization**:
   - Strict payload parsing rejecting non-numeric values for physical quantities (speed, distance, engine displacement).
   - Strict enumeration guards for fuel types (`PETROL`, `DIESEL`, `ELECTRIC`, `HYBRID`) and challenge categories (`SAFETY`, `FUEL_SAVING`, `ECO_DRIVING`, `STREAK`).

---

## 8. Deployment Topology

- **Frontend**: Static Web Assets hosted via Vercel Edge / Static CDN.
- **Backend**: Containerized Node.js runtime hosted on Render / Linux VPS with Node process monitoring.
- **Database**: MongoDB Atlas Managed Cluster with replica sets, automated daily snapshots, and TLS/SSL in-transit encryption.
- **Continuous Integration**: Local automated regression testing pipeline (`npm test`) executing Jest suites prior to every Git push.
