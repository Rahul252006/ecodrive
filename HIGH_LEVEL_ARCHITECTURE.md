# High-Level System Architecture — EcoDrive

This document provides a clean, high-resolution architectural diagram for **EcoDrive**, engineered so that every component, keyword, protocol, and computational engine is visible without text truncation.

---

## 1. High-Level Architecture Blueprint

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
    classDef subGraphStyle fill:#0b0f19,stroke:#334155,stroke-width:1.5px,color:#94a3b8;

    %% =======================================================
    %% TIER 1: CLIENT PRESENTATION TIER
    %% =======================================================
    subgraph TIER1 ["1. CLIENT PRESENTATION TIER (Browser Vanilla Web Stack)"]
        direction LR
        UI["User Interface<br/>(HTML5 / CSS3 Glassmorphism)"]:::clientStyle
        SIM["CAN-Bus / OBD-II Simulator<br/>(Real-Time Engine PID Ticks)"]:::clientStyle
        PAGES["Page Controllers<br/>(dashboard.js, trips.js, add-trip.js)"]:::clientStyle
        VIZ["Visualization Engines<br/>(Chart.js 4.4 + Leaflet.js Maps)"]:::clientStyle
        HTTP_CLIENT["API Client Module (api.js)<br/>(Fetch API + JWT Bearer Auth)"]:::clientStyle
    end

    %% =======================================================
    %% TIER 2: EDGE & GATEWAY TIER
    %% =======================================================
    subgraph TIER2 ["2. GATEWAY & REVERSE PROXY TIER"]
        direction LR
        CDN["Static CDN & Edge Hosting<br/>(Vercel Edge Network)"]:::edgeStyle
        REVERSE_PROXY["Reverse Proxy & SSL/TLS<br/>(Render Cloud Gateway)"]:::edgeStyle
    end

    %% =======================================================
    %% TIER 3: SERVER & APPLICATION TIER
    %% =======================================================
    subgraph TIER3 ["3. BACKEND API APPLICATION TIER (Node.js & Express)"]
        direction TB
        subgraph SEC ["Security & Traffic Middleware"]
            HELMET["Helmet Middleware<br/>(HTTP Security Headers)"]:::serverStyle
            CORS_MW["CORS Protection<br/>(Dynamic Whitelist)"]:::serverStyle
            RATE_LIMIT["Rate Limiter<br/>(200 Requests / 15 Min)"]:::serverStyle
        end

        subgraph ROUTING ["API Routing & Interceptors"]
            ROUTER["Express REST Router<br/>(/api/v1 Endpoints)"]:::serverStyle
            JWT_AUTH["JWT Authentication<br/>(Bearer Token Verification)"]:::serverStyle
            VALIDATOR["Input Validator<br/>(express-validator)"]:::serverStyle
        end

        subgraph CONTROLLERS ["Controller Dispatch Layer"]
            AUTH_CTRL["Auth Controller<br/>(Register, Login, Session)"]:::serverStyle
            TRIP_CTRL["Trip Controller<br/>(Ingest, Filter, Query)"]:::serverStyle
            VEH_CTRL["Vehicle Controller<br/>(Garage & Fuel Configs)"]:::serverStyle
            ANALYTICS_CTRL["Analytics Controller<br/>(KPI Aggregation & Trends)"]:::serverStyle
            GAMIFY_CTRL["Gamification Controller<br/>(Challenges & Leaderboard)"]:::serverStyle
        end
    end

    %% =======================================================
    %% TIER 4: COMPUTATIONAL & DOMAIN ENGINES
    %% =======================================================
    subgraph TIER4 ["4. CORE COMPUTATIONAL & DOMAIN ENGINES"]
        direction TB
        ECO_ENGINE["1. EcoScore Scoring Engine<br/>(25% Accel + 20% Brake + 15% Idle + 15% Speed + 15% Eff + 10% Route)"]:::engineStyle
        FUEL_ENGINE["2. Fuel & Energy Physics Engine<br/>(Petrol: ₹102/L | Diesel: ₹88/L | EV: ₹10/kWh)"]:::engineStyle
        EMISS_ENGINE["3. Carbon Emissions Engine<br/>(Petrol: 2.31 kg/L | Diesel: 2.68 kg/L | EV: 0.71 kg/kWh)"]:::engineStyle
        COACH_ENGINE["4. Algorithmic Coaching Engine<br/>(Rule-Based Behavioral Feedback & Weakest-Factor Diagnostic)"]:::engineStyle
        ML_ENGINE["5. Machine Learning Inference Engine<br/>(VED Trained Gradient Boosting & OLS Baseline Inferences)"]:::engineStyle
        CHALL_ENGINE["6. Gamification & Progression Engine<br/>(Challenge Evaluation, XP Accrual, Driver Level Ups)"]:::engineStyle
    end

    %% =======================================================
    %% TIER 5: PERSISTENCE & DATA STORAGE TIER
    %% =======================================================
    subgraph TIER5 ["5. PERSISTENCE LAYER (MongoDB Database Cluster)"]
        direction LR
        MONGO_DB[("MongoDB Database<br/>(Replica Set Instance)")]:::dataStyle
        MODELS["Mongoose ODM Schemas:<br/>• User (Auth, Level, Custom Fuel Rates)<br/>• Vehicle (Make, Model, Fuel Type)<br/>• Trip (Odometer, EcoScore, Cost in ₹)<br/>• Challenge (Category, Target, XP)<br/>• UserChallenge (Progress, Status)<br/>• Achievement (Unlocked Badges)"]:::dataStyle
    end

    %% =======================================================
    %% RELATIONSHIPS & DATA FLOW PIPELINES
    %% =======================================================
    UI --> PAGES
    SIM --> PAGES
    PAGES --> VIZ
    PAGES --> HTTP_CLIENT

    HTTP_CLIENT -->|"HTTPS / REST Request (JWT Token)"| CDN
    CDN --> REVERSE_PROXY
    REVERSE_PROXY --> HELMET
    HELMET --> CORS_MW
    CORS_MW --> RATE_LIMIT
    RATE_LIMIT --> ROUTER
    ROUTER --> JWT_AUTH
    JWT_AUTH --> VALIDATOR

    VALIDATOR --> AUTH_CTRL
    VALIDATOR --> TRIP_CTRL
    VALIDATOR --> VEH_CTRL
    VALIDATOR --> ANALYTICS_CTRL
    VALIDATOR --> GAMIFY_CTRL

    TRIP_CTRL -->|"Telemetry Payload"| ECO_ENGINE
    TRIP_CTRL -->|"Powertrain & Distance"| FUEL_ENGINE
    TRIP_CTRL -->|"Fuel/Energy Result"| EMISS_ENGINE
    TRIP_CTRL -->|"Scores & Baselines"| COACH_ENGINE
    TRIP_CTRL -->|"Speed & Idle Vectors"| ML_ENGINE
    TRIP_CTRL -->|"Trip Metrics"| CHALL_ENGINE

    AUTH_CTRL --> MODELS
    VEH_CTRL --> MODELS
    ANALYTICS_CTRL --> MODELS
    GAMIFY_CTRL --> MODELS
    ECO_ENGINE --> MODELS
    FUEL_ENGINE --> MODELS
    CHALL_ENGINE --> MODELS

    MODELS <-->|"Mongoose Read / Write Operations"| MONGO_DB
```

---

## 2. Architectural Tier Breakdown

### Tier 1: Client Presentation Tier
* **HTML5 / CSS3 Design System**: Custom glassmorphism aesthetic built with pure CSS custom properties (`--bg-primary`, `--accent-teal`, `--glass-bg`). Eliminates external UI framework overhead.
* **CAN-Bus / OBD-II Simulator** (`add-trip.js`): Generates synthetic engine PIDs (Vehicle Speed, RPM, Throttle Position, Brake Pressure, Fuel Flow Rate, Lateral G-Force) at 1 Hz intervals.
* **Page Controllers**: Modular scripts governing page state (`dashboard.js`, `trips.js`, `trip-details.js`, `vehicles.js`, `challenges.js`, `settings.js`).
* **Visualizations**: Hardware-accelerated Chart.js canvases (multi-axis line charts, 6-factor radar graphs, efficiency doughnuts) and Leaflet.js GPS map breadcrumbs with speed/braking heatmaps.
* **API Client** (`api.js`): Centralized HTTP communication layer handling JWT injection, automatic loading overlays, and 401 token expiry redirects.

---

### Tier 2: Gateway & Reverse Proxy Tier
* **Vercel Edge Network**: High-speed global CDN serving static frontend assets (HTML, CSS, JS, images) with sub-100ms first paint.
* **Render Cloud Gateway**: Handles SSL/TLS termination, reverse proxy routing, and forwards secure traffic to the Express Node.js application process.

---

### Tier 3: Backend API Application Tier (Node.js & Express)
* **Traffic & Security Middleware**:
  * **Helmet**: Enforces strict HTTP headers (HSTS, Content Security Policy, X-Frame-Options, X-Content-Type-Options).
  * **CORS Protection**: Dynamic origin validation whitelist allowing authorized domains while permitting programmatic API clients.
  * **Rate Limiter**: Sliding-window rate limiter restricting IP addresses to a max of 200 API requests per 15-minute window.
* **Routing & Authentication**:
  * **Express Router**: Structured RESTful routes (`/api/auth`, `/api/trips`, `/api/vehicles`, `/api/analytics`, `/api/challenges`, `/api/leaderboard`).
  * **JWT Middleware** (`auth.middleware.js`): Validates cryptographically signed HMAC-SHA256 tokens and extracts authenticated driver context (`req.user.id`).
  * **Input Validation** (`validators.js`): Rejects malformed physical metrics before reaching business services.
* **Controller Layer**:
  * Decouples HTTP request/response serialization from backend domain calculations.

---

### Tier 4: Core Computational & Domain Engines

| Engine | Primary Service File | Core Formula / Algorithmic Responsibility |
| :--- | :--- | :--- |
| **1. EcoScore Engine** | `ecoScore.service.js` | $\text{EcoScore} = 0.25 S_{\text{accel}} + 0.20 S_{\text{brake}} + 0.15 S_{\text{idle}} + 0.15 S_{\text{speed}} + 0.15 S_{\text{eff}} + 0.10 S_{\text{route}}$ |
| **2. Fuel & Energy Engine** | `fuel.service.js` | Differentiates **Petrol** (₹102.00/L), **Diesel** (₹88.00/L), and **EV** (₹10.00/kWh). Applies speed/score penalty multipliers and regenerative braking capture. |
| **3. Emissions Engine** | `emissions.service.js` | Quantifies TTW and WTW carbon: Petrol ($2.31\text{ kg CO}_2/\text{L}$), Diesel ($2.68\text{ kg CO}_2/\text{L}$), Grid EV ($0.71\text{ kg CO}_2/\text{kWh}$). Computes mature tree absorption equivalency. |
| **4. Coaching Engine** | `coaching.service.js` | Diagnostic rule trees identifying weakest sub-scores to generate contextual driving advice. |
| **5. ML Inference Engine** | `ml.service.js` | Evaluates trained Gradient Boosting and Linear Regression models (VED dataset) against trip telemetry to calculate fuel savings vs baseline. |
| **6. Gamification Engine** | `challenge.service.js` | Evaluates qualifying trips against active challenge rules, awards XP, and updates driver levels. |

---

### Tier 5: Persistence & Data Storage Tier (MongoDB & Mongoose)
* **MongoDB Document Model**: Flexible BSON documents optimized for semi-structured time-series OBD-II telemetry points.
* **Mongoose ODM**: Strict schema models (`User`, `Vehicle`, `Trip`, `Challenge`, `UserChallenge`, `Achievement`, `WeeklyReport`).
* **Compound Indexing Strategy**:
  * `{ userId: 1, tripDate: -1 }`: Accelerates dashboard KPIs and historical trip pagination to under 12ms.
  * `{ userId: 1, defaultVehicle: 1 }`: Rapid garage default resolution.
  * `{ email: 1 }`: Unique index powering high-throughput authentication.

---

## 3. Telemetry Ingestion Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Driver as Driver / CAN-Bus Sim
    participant API as POST /api/trips
    participant Middleware as Auth & RateLimit Middleware
    participant Controller as Trip Controller
    participant EcoSvc as EcoScore Engine
    participant FuelSvc as Fuel & Energy Engine
    participant EmissSvc as Emissions Engine
    participant CoachSvc as Coaching Engine
    participant ChallSvc as Gamification Engine
    participant DB as MongoDB Cluster

    Driver->>API: Submits Trip Data (Distance, Duration, Telemetry Array)
    API->>Middleware: Checks Rate Limit & Verifies JWT Token
    Middleware->>Controller: Forwards Authorized Payload
    
    par Multi-Engine Processing Pipeline
        Controller->>EcoSvc: Calculate 6-Factor EcoScore (0 - 100)
        EcoSvc-->>Controller: Returns Overall Score + Breakdown
    and
        Controller->>FuelSvc: Calculate Fuel & Energy (Petrol / Diesel / EV Rates)
        FuelSvc-->>Controller: Returns Liters/kWh & Exact Cost in ₹
    and
        Controller->>EmissSvc: Calculate Carbon Footprint (TTW & WTW)
        EmissSvc-->>Controller: Returns CO2 Emissions (kg) & Tree Equivalents
    end

    Controller->>CoachSvc: Evaluate Weakest Factor & Generate Advice
    CoachSvc-->>Controller: Returns Actionable Feedback Tips

    Controller->>DB: Atomically Writes Trip Document
    
    Controller->>ChallSvc: Evaluate Active Driver Challenges
    ChallSvc->>DB: Increments XP, Updates Streak, Unlocks Badges

    Controller-->>Driver: Returns 201 Created with Computed Analytics & Rupee Cost
```
