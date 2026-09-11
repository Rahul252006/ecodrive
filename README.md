# EcoDrive

EcoDrive is a production-oriented consumer driving intelligence platform
built around the promise:

**Drive better. Spend less. Emit less.**

It helps drivers understand trip efficiency, estimated fuel/energy use,
estimated CO2 emissions, driving behavior, personal trends, challenges,
and improvement over time.

## V1 Stack

-   Frontend: HTML, CSS, JavaScript
-   Backend: Node.js, Express.js
-   Database: MongoDB
-   Frontend deployment: Vercel
-   Backend deployment: Render
-   Analytics/ML experimentation: Python + Jupyter

## Important Product Boundary

The external real-world dataset is used for data science, analytics,
feature engineering, ML experimentation, and validation. It is not the
customer's production dashboard data.

Customer trips are created/imported by authenticated users and stored in
MongoDB.

## Product Principle

Do not build a fake college-project dashboard. Every feature must
provide real user value and every visible action must work or clearly
state that it is unavailable.
