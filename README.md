# EcoDrive — Connected Vehicle Intelligence & Eco-Driving Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18.2-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208.2.1-brightgreen.svg)](https://www.mongodb.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-15%2F15%20Passing-success.svg)](https://jestjs.io/)
[![Frontend Deployment](https://img.shields.io/badge/Deployment-Vercel-black.svg)](https://ecodrive-phi.vercel.app/)

**Drive Better. Spend Less. Emit Less.**

[Live Application Demo](https://ecodrive-phi.vercel.app/) &bull; [Architecture Guide](ARCHITECTURE.md) &bull; [Application Flow](APPLICATION_FLOW.md)

</div>

---

## 1. Overview

**EcoDrive** is a production-grade connected-vehicle analytics, eco-driving scoring, and carbon reduction platform. It ingests high-frequency vehicular telemetry (CAN-bus / OBD-II data), processes multi-dimensional driving behavior, computes physics-based fuel and electrical energy consumption, quantifies carbon emissions, and provides algorithmic driver coaching with gamified incentives.

Unlike generic retroactive dashboard gauges, EcoDrive gives drivers second-by-second visibility into throttle aggressiveness, kinetic energy recapture, idling waste, and localized fuel costs in Indian Rupees (₹).

---

## 2. Key Features

### 🏎️ Telemetry & CAN-Bus Ingestion
- **Live Driving Simulator**: Real-time CAN-bus / OBD-II emulator generating engine PIDs (Speed, RPM, Throttle %, Brake Pressure, Lateral G-Force, Fuel Flow Rate).
- **Manual Trip Logger**: Rapid manual trip entry for odometer readings, commute times, and start/destination points.
- **Forensic Route Mapping**: Interactive Leaflet.js and OpenStreetMap route inspection with GPS breadcrumbs and hard acceleration/braking markers.

### 📊 Deterministic 6-Factor EcoScore Engine
- Normalizes driving behavior into an index from $0$ to $100$:
  - **Acceleration Smoothness (25%)**: Penalizes abrupt throttle spikes ($> 3.0\text{ m/s}^2$).
  - **Braking Smoothness (20%)**: Penalizes sudden kinetic energy dissipation ($< -3.0\text{ m/s}^2$).
  - **Idle Minimization (15%)**: Quantifies wasted stationary fuel burn ($> 60\text{ seconds}$).
  - **Speed Consistency (15%)**: Rewards steady highway cruising and aerodynamic efficiency.
  - **Powertrain Efficiency (15%)**: Benchmarks consumption against EPA / WLTP vehicle baselines.
  - **Route Efficiency (10%)**: Analyzes route directness and elevation stability.

### ⛽ Multi-Powertrain Fuel & Energy Physics
- **Powertrain Specifics**: Individual physical models for **Petrol (Gasoline)**, **Diesel**, **Hybrids (HEV)**, and **Electric Vehicles (EV)**.
- **Market Rates**:
  - **Petrol**: ₹102.00 / Liter
  - **Diesel**: ₹88.00 / Liter
  - **Electricity (EV)**: ₹10.00 / kWh
- **Transparent Calculations**: Clean distinction between fuel consumption (L) and battery draw (kWh) across all dashboard KPI cards and trip detail feeds.

### 🌱 Carbon Emissions & Tree Equivalency Engine
- Direct Tank-to-Wheel (TTW) and Well-to-Wheel (WTW) carbon emissions quantification:
  - Petrol: $2.31\text{ kg CO}_2 / \text{Liter}$
  - Diesel: $2.68\text{ kg CO}_2 / \text{Liter}$
  - Electric Grid Baseline: $0.71\text{ kg CO}_2 / \text{kWh}$
- Real-world equivalency metrics calculating urban trees required to offset emissions.

### 🤖 Machine Learning Fuel Inferences
- Embedded ML inference pipeline trained on real-world Vehicle Energy Dataset (VED) telemetry.
- Evaluates Gradient Boosting and Linear Regression baselines against actual driving consumption to surface savings insights.

### 🏆 Gamification & Driver Coaching
- **Behavioral Challenges**: Categorized goals (`SAFETY`, `FUEL_SAVING`, `ECO_DRIVING`, `STREAK`).
- **XP & Level Progression**: Experience Points awarded for smooth journeys and high EcoScores.
- **Privacy-Safe Leaderboard**: Anonymized driver rankings filtered by overall score and vehicle category.
- **Algorithmic Coaching**: Context-aware recommendations targeting the driver's weakest metric.

---

## 3. Technology Stack

| Layer | Technologies | Description |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5, Vanilla CSS3, Glassmorphism Design System | Sub-100ms first paint, dark-mode specular styling, zero bulky framework overhead |
| **Client Scripting** | Vanilla JavaScript (ES6+ Modules) | Modular client architecture (`api.js`, `charts.js`, `guards.js`, `utils.js`) |
| **Visualizations** | Chart.js 4.4.1 & Leaflet.js 1.9.4 | Hardware-accelerated radar/doughnut/line charts & interactive GPS routing |
| **Backend API** | Node.js (v18+ LTS) & Express.js 4.18.2 | Layered N-Tier REST API with non-blocking async architecture |
| **Database** | MongoDB with Mongoose ODM 8.2.1 | Document store optimized with compound indexes for trip analytics |
| **Security** | JWT, Bcrypt.js, Helmet, CORS, Rate-Limit | Stateless Bearer auth, password salting, IP rate limiting, and HTTP security headers |
| **Testing** | Jest 29.7.0 & Supertest 6.3.4 | Automated unit and end-to-end integration test suites (15/15 passing) |
| **Deployment** | Vercel (Frontend) & Render (Backend) | Globally distributed edge hosting and containerized API services |

---

## 4. System Architecture

```
[ Browser Client UI (Vanilla JS + Chart.js + Leaflet.js) ]
                         │
                         ▼  (HTTPS / REST / JWT Bearer)
   [ Express API Server (Node.js, Helmet, CORS, Rate-Limit) ]
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
[ EcoScore Engine ] [ Fuel Engine ] [ Emissions Engine ]
        │                │                │
        └────────────────┼────────────────┘
                         ▼
             [ Coaching & ML Inferences ]
                         │
                         ▼
        [ MongoDB Database (Mongoose ODM) ]
```

*For comprehensive architecture specifications, see [ARCHITECTURE.md](ARCHITECTURE.md).*  
*For end-to-end sequence diagrams and request lifecycles, see [APPLICATION_FLOW.md](APPLICATION_FLOW.md).*

---

## 5. Repository Structure

```
ecodrive/
├── ARCHITECTURE.md                  # Comprehensive System Architecture Specification
├── APPLICATION_FLOW.md              # Detailed Frontend-to-Backend Sequence Flows
├── README.md                        # Master Project Documentation
├── vercel.json                      # Vercel deployment configuration
├── backend/
│   ├── config/                      # Database & environment configurations
│   ├── controllers/                 # Route controllers (trip, user, vehicle, analytics)
│   ├── middleware/                  # JWT auth, rate limiter, global error handling
│   ├── models/                      # Mongoose schemas (User, Vehicle, Trip, Challenge)
│   ├── routes/                      # Express REST endpoints
│   ├── scripts/                     # Seed data generator with demo accounts & trips
│   ├── services/                    # Pure domain calculation engines (ecoScore, fuel, emissions)
│   ├── tests/                       # Jest & Supertest integration test suite
│   ├── utils/                       # Constants, mathematical formulas, and validators
│   ├── server.js                    # Express application entrypoint
│   └── package.json                 # Backend dependencies & scripts
└── frontend/
    ├── css/                         # Custom design system, layout, and component styles
    ├── js/                          # Client-side modules (api.js, dashboard.js, add-trip.js)
    ├── index.html                   # Public product showcase & live telemetry console
    ├── dashboard.html               # Real-time driver efficiency cockpit
    ├── trips.html                   # Historical trip log and vehicle filtering
    ├── trip-details.html            # Deep-dive forensic route & telematics inspection
    ├── add-trip.html                # Live CAN-bus simulator & manual trip submission
    ├── vehicles.html                # Fleet & garage management (Petrol, Diesel, EV, HEV)
    ├── challenges.html              # Driver behavior challenges & XP rewards
    ├── leaderboard.html             # Driver rankings and community standings
    ├── settings.html                # Regional fuel pricing preferences (₹/L, ₹/kWh)
    └── login.html / register.html   # Driver authentication & session onboarding
```

---

## 6. Getting Started Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/ecodrive`) or a MongoDB Atlas URI
- **Git**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Rahul252006/ecodrive.git
   cd ecodrive
   ```

2. **Configure Environment Variables**:
   In `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/ecodrive
   JWT_SECRET=super_secret_jwt_key_ecodrive_2026
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:3000
   ```

3. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

4. **Seed the Database with Demo Data**:
   Populates challenges, demo vehicles (Tesla Model 3, Toyota Prius, Honda Civic, Hyundai Creta Diesel), and realistic historical trips:
   ```bash
   npm run seed
   ```

   **Default Demo Account Credentials**:
   - **Email**: `demo@ecodrive.com`
   - **Password**: `Password123!`

5. **Start the Backend API Server**:
   ```bash
   npm start
   # Server runs on http://localhost:5000
   ```

6. **Serve the Frontend**:
   From the repository root in a separate terminal:
   ```bash
   python3 -m http.server 3000 -d frontend
   # Frontend runs on http://localhost:3000
   ```
   Open `http://localhost:3000` in your web browser.

---

## 7. Running Tests

EcoDrive includes a Jest and Supertest regression suite validating math engines, emissions factors, and REST API routes:

```bash
cd backend
npm test
```

**Test Coverage**:
- `tests/ecoScore.test.js`: Validates 6-factor weighting, acceleration/braking penalties, and EV/ICE fuel rates.
- `tests/api.test.js`: Validates authentication, vehicle garage operations, trip ingestion, dashboard analytics, and leaderboards.

---

## 8. API Reference

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Register a new driver account |
| `/api/auth/login` | `POST` | Public | Authenticate driver and receive JWT Bearer token |
| `/api/auth/me` | `GET` | Bearer | Retrieve active authenticated driver profile |
| `/api/vehicles` | `GET`, `POST` | Bearer | List vehicles or add Petrol/Diesel/EV vehicle |
| `/api/trips` | `GET`, `POST` | Bearer | Query paginated trips or ingest new CAN-bus trip |
| `/api/trips/:id` | `GET`, `DELETE` | Bearer | Retrieve granular GPS telematics for a single trip |
| `/api/analytics/dashboard`| `GET` | Bearer | Aggregate 30-day trips, EcoScore, and fuel cost (₹) |
| `/api/challenges` | `GET` | Bearer | Retrieve available and active driver challenges |
| `/api/challenges/:id/accept` | `POST` | Bearer | Accept a driving efficiency challenge |
| `/api/leaderboard` | `GET` | Bearer | Retrieve global driver efficiency rankings |
| `/api/user/settings` | `PUT` | Bearer | Update fuel rates (Petrol ₹, Diesel ₹, EV ₹) |

---

## 9. Live Deployment

- **Frontend**: Hosted on Vercel at [https://ecodrive-phi.vercel.app/](https://ecodrive-phi.vercel.app/)
- **Backend API**: Hosted on Render with MongoDB Atlas database clustering

---

## 10. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
