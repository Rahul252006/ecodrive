# EcoDrive Project Structure

``` text
EcoDrive/
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── onboarding.html
│   ├── dashboard.html
│   ├── trips.html
│   ├── trip-details.html
│   ├── add-trip.html
│   ├── vehicles.html
│   ├── vehicle-details.html
│   ├── challenges.html
│   ├── leaderboard.html
│   ├── reports.html
│   ├── profile.html
│   ├── settings.html
│   ├── css/
│   │   ├── reset.css
│   │   ├── variables.css
│   │   ├── base.css
│   │   ├── components.css
│   │   ├── layout.css
│   │   ├── auth.css
│   │   ├── onboarding.css
│   │   ├── dashboard.css
│   │   ├── trips.css
│   │   ├── vehicles.css
│   │   ├── challenges.css
│   │   ├── leaderboard.css
│   │   ├── reports.css
│   │   ├── profile.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── config.js
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── guards.js
│   │   ├── onboarding.js
│   │   ├── dashboard.js
│   │   ├── trips.js
│   │   ├── trip-details.js
│   │   ├── add-trip.js
│   │   ├── vehicles.js
│   │   ├── challenges.js
│   │   ├── leaderboard.js
│   │   ├── reports.js
│   │   ├── profile.js
│   │   ├── settings.js
│   │   ├── charts.js
│   │   ├── components.js
│   │   └── utils.js
│   └── assets/
│       ├── logo.svg
│       ├── icons/
│       └── images/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/
│   │   ├── db.js
│   │   └── environment.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Vehicle.js
│   │   ├── Trip.js
│   │   ├── Challenge.js
│   │   ├── UserChallenge.js
│   │   ├── Achievement.js
│   │   └── WeeklyReport.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── vehicle.routes.js
│   │   ├── trip.routes.js
│   │   ├── analytics.routes.js
│   │   ├── challenge.routes.js
│   │   ├── leaderboard.routes.js
│   │   └── report.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── vehicle.controller.js
│   │   ├── trip.controller.js
│   │   ├── analytics.controller.js
│   │   ├── challenge.controller.js
│   │   ├── leaderboard.controller.js
│   │   └── report.controller.js
│   ├── services/
│   │   ├── trip.service.js
│   │   ├── ecoScore.service.js
│   │   ├── emissions.service.js
│   │   ├── fuel.service.js
│   │   ├── coaching.service.js
│   │   ├── challenge.service.js
│   │   ├── leaderboard.service.js
│   │   └── report.service.js
│   ├── ml/
│   │   ├── eco_driving_model.joblib
│   │   ├── model_metadata.json
│   │   └── predict.py
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── error.middleware.js
│   │   └── rateLimit.middleware.js
│   ├── scripts/
│   │   └── seed.js
│   └── utils/
│       ├── validators.js
│       ├── constants.js
│       └── calculations.js
│
├── docs/
│   ├── 00_PRODUCT_VISION.md
│   ├── ...
│   └── 45_ROADMAP.md
│
├── README.md
├── PROJECT_STRUCTURE.md
├── vercel.json
├── .gitignore
└── LICENSE
```

## Folder Responsibilities

### frontend/

Only browser-facing code (HTML, CSS, JS, Assets). Deployed to Vercel.

### backend/

Server API, database schemas, business logic, and ML model inference engine (`backend/ml/`). Deployed to Render.

### docs/

Product, engineering, UX, security, and deployment documentation source of truth.

## Deployment

Frontend → Vercel

Backend → Render

Database → MongoDB Atlas
