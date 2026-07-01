# 1. Introduction
* **Project Title**: StockBridge Stock Trader
* **Team Members**: [Your Name / Team Members here]

# 2. Project Overview
* **Purpose**: StockBridge is a full-stack web application built to simulate a real-world stock market. Its goal is to provide users with a risk-free environment to practice trading, track portfolio performance, and understand market dynamics using virtual currency.
* **Features**:
  - Real-time simulated stock price fluctuations.
  - Interactive price history charts (via Chart.js).
  - Virtual portfolio management with profit/loss tracking.
  - Buy and Sell trade execution.
  - Secure user authentication and authorization.
  - Admin Dashboard for platform analytics and user management.

# 3. Architecture
* **Frontend**: The frontend is built using **React.js** and **Vite** for rapid development and optimized performance. It uses React Router for client-side navigation, Axios for API communication, and Context/State for managing user sessions. The UI is custom-styled with pure CSS utilizing a dark-mode glassmorphism aesthetic.
* **Backend**: The backend is powered by **Node.js** and **Express.js**. It follows a standard MVC (Model-View-Controller) architecture. It handles routing, secure password hashing, JWT token generation, and runs a background `marketSimulator` that mathematically fluctuates stock prices every 10 seconds.
* **Database**: Designed for **MongoDB** using Mongoose ORM (with an intelligent In-Memory RAM fallback engine for offline testing). 
  - *User Schema*: Stores credentials, role (USER/ADMIN), and virtual cash balance.
  - *Stock Schema*: Stores company symbol, current price, daily high/low, and market cap.
  - *Portfolio Schema*: Tracks which stocks a user owns, the average buy price, and quantity.
  - *Transaction Schema*: A ledger recording every buy/sell action, timestamp, and total cost.

# 4. Setup Instructions
* **Prerequisites**: 
  - Node.js (v16+)
  - MongoDB (Local installation or MongoDB Atlas URI)
  - Git
* **Installation**:
  1. Clone the repository: `git clone https://github.com/gamberaopetspoorthi06/-Shopez.git`
  2. Navigate to backend: `cd shopez/backend` and run `npm install`
  3. Create a `.env` file in the backend directory:
     ```env
     PORT=5000
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_secret_key
     ```
  4. Navigate to frontend: `cd ../frontend` and run `npm install`

# 5. Folder Structure
* **Client (frontend/)**:
  - `src/components/`: Reusable UI elements (Navbar, StockCard, Charts, Protected Routes).
  - `src/pages/`: Main views (Dashboard, Login, Register, Portfolio, Admin Dashboard).
  - `src/services/`: Axios API configuration and endpoint methods (`api.js`).
* **Server (backend/)**:
  - `config/`: Database connection logic and In-Memory fallback DB engine.
  - `controllers/`: Business logic for Auth, Stocks, Trades, and Admin actions.
  - `middleware/`: JWT verification and Admin role checking.
  - `models/`: Mongoose Database Schemas.
  - `routes/`: Express router definitions mapping URLs to controllers.
  - `services/`: Background tasks (e.g., market simulator algorithm).

# 6. Running the Application
* **Backend**: Open a terminal, navigate to the `backend` directory, and run:
  ```bash
  npm run dev
  ```
  *(Runs on http://localhost:5000)*
* **Frontend**: Open a second terminal, navigate to the `frontend` directory, and run:
  ```bash
  npm run dev
  ```
  *(Runs on http://localhost:5173)*

# 7. API Documentation
* **Auth Endpoints**:
  - `POST /api/auth/register` - Registers a user. Params: `username`, `email`, `password`. Returns JWT.
  - `POST /api/auth/login` - Authenticates user. Params: `email`, `password`. Returns JWT.
* **Stock Endpoints**:
  - `GET /api/stocks` - Returns a list of all available stocks and current prices.
  - `GET /api/stocks/:symbol` - Returns details and historical data for a specific stock.
* **Trade Endpoints** (Requires JWT):
  - `POST /api/trades/buy` - Buys shares. Params: `symbol`, `quantity`. Deducts cash.
  - `POST /api/trades/sell` - Sells shares. Params: `symbol`, `quantity`. Adds cash.
  - `GET /api/trades/portfolio` - Returns the logged-in user's currently owned stocks.
* **Admin Endpoints** (Requires JWT + Admin Role):
  - `GET /api/admin/analytics` - Returns platform-wide stats (total users, total trade volume).

# 8. Authentication
* The application uses **JSON Web Tokens (JWT)**. 
* When a user logs in, the Node.js server verifies the hashed password using `bcryptjs` and generates a token signed with a secret key. 
* This token is sent to the React frontend, which stores it in `localStorage`. 
* For every protected request (like buying a stock), the frontend attaches the token in the `Authorization: Bearer <token>` HTTP Header.
* The backend `auth.js` middleware intercepts the request, verifies the token signature, and attaches the user data to `req.user` before allowing access to the controller.

# 9. User Interface
* **Dashboard**: Displays a grid of live updating stock tickers with green/red indicators.
* **Detail Page**: Shows a large interactive line chart and a dynamic total-cost calculator.
* **Portfolio**: A data-table UI calculating exact real-time Profit and Loss per asset.
* **Admin Panel**: A restricted dashboard with analytical metric cards.

# 10. Testing
* **Strategy**: Manual Integration and API Testing.
* **Tools Used**: 
  - **Postman** was used to verify all backend API endpoints, payload validation, and JWT security barriers independently.
  - **Browser DevTools** (Network & Console tabs) were utilized for debugging React state and API payload formatting.

# 11. Screenshots or Demo
* **Repository Link**: [https://github.com/gamberaopetspoorthi06/-Shopez](https://github.com/gamberaopetspoorthi06/-Shopez)
* *(Note: Add your own screenshots of the Dashboard and Portfolio here when submitting your report!)*

# 12. Known Issues
* When running without MongoDB (In-Memory DB mode), all user data, trades, and portfolio history are wiped clean if the Node.js backend server restarts.
* The chart history resets on server reboot.

# 13. Future Enhancements
* **Real API Integration**: Replace the algorithmic market simulator with a real financial API (like Polygon.io or AlphaVantage) to fetch real-world stock prices.
* **Leaderboard**: Add a social ranking page to see which user has generated the most profit.
* **Crypto Trading**: Expand the platform to support Bitcoin and Ethereum trading pairs.
* **Mobile App**: Port the React UI into React Native for an iOS and Android application.
