# AI-Powered Personal Expense Tracker

A comprehensive MERN stack expense tracking application with AI-powered insights, suitable for final year projects and product-based company resumes.

## 🚀 Features

- **User Authentication**: Secure JWT-based auth with refresh tokens
- **Expense Management**: Full CRUD operations with categorization
- **Budget Tracking**: Set monthly budgets and track actual vs planned spending
- **Advanced Analytics**: MongoDB aggregation pipelines for insights
- **AI-Powered Insights**: OpenAI integration for spending analysis and recommendations
- **Data Export**: Download expense reports as CSV/PDF
- **Beautiful Dashboards**: Interactive charts with Chart.js
- **Responsive Design**: Works on desktop, tablet, and mobile

## 📋 Tech Stack

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB (with Mongoose)
- **Authentication**: JWT (Access + Refresh tokens)
- **Security**: bcryptjs, helmet, CORS
- **AI**: OpenAI API
- **Export**: PDFKit, json2csv

### Frontend
- **Framework**: React.js (with Hooks)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios (with interceptors)
- **Charts**: Chart.js + React-Chartjs-2
- **Build Tool**: Vite

## 🛠️ Installation & Setup

### Prerequisites
- Node.js v16+ installed
- MongoDB Atlas account (free tier)
- OpenAI API key (optional, works with mock data)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development

# MongoDB - Replace with your connection string
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/expense-tracker

# JWT Secrets - Generate strong random strings
JWT_ACCESS_SECRET=your_secret_access_key_min_32_characters
JWT_REFRESH_SECRET=your_secret_refresh_key_min_32_characters
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# OpenAI (optional)
OPENAI_API_KEY=sk-your-api-key-here

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

4. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile

### Expense Endpoints
- `POST /api/expenses` - Create expense
- `GET /api/expenses` - Get all expenses (with filters)
- `GET /api/expenses/summary` - Get expense summary
- `GET /api/expenses/:id` - Get single expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Budget Endpoints
- `POST /api/budgets` - Set/create budget
- `GET /api/budgets` - Get all budgets
- `GET /api/budgets/current-month` - Get current month budgets with actuals
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Analytics Endpoints
- `GET /api/analytics/dashboard` - Get comprehensive dashboard data
- `GET /api/analytics/category-totals` - Get category-wise spending
- `GET /api/analytics/monthly-trend` - Get monthly trend (6 months)
- `GET /api/analytics/yearly-summary` - Get yearly summary
- `GET /api/analytics/overspending` - Get overspending categories
- `GET /api/analytics/top-categories` - Get top spending categories

### AI Endpoints
- `POST /api/ai/generate-insights` - Generate AI insights
- `GET /api/ai/saving-tips` - Get saving tips
- `GET /api/ai/predict-risk` - Predict overspending risk
- `GET /api/ai/cached` - Get cached insights

### Export Endpoints
- `GET /api/export/csv` - Download CSV report
- `GET /api/export/pdf` - Download PDF report

## 🏗️ Project Structure

```
expense-tracker/
├── backend/
│   ├── config/        # Database configuration
│   ├── models/        # Mongoose schemas
│   ├── controllers/   # Route controllers
│   ├── routes/        # API routes
│   ├── middleware/    # Auth & validation middleware
│   ├── services/      # AI & export services
│   ├── utils/         # Aggregation utilities
│   └── server.js      # Express app entry point
│
└── frontend/
    ├── src/
    │   ├── components/  # React components
    │   ├── pages/       # Page components
    │   ├── services/    # API services
    │   ├── context/     # Context providers
    │   ├── utils/       # Utility functions
    │   └── App.jsx      # Main app component
    └── public/
```

## 🎓 For Viva/Interview Preparation

### Why This Project is Better Than Basic CRUD?

1. **Advanced MongoDB Aggregations**: Complex financial analytics using pipelines
2. **Production-Grade Security**: JWT refresh tokens, bcrypt, input validation
3. **AI Integration**: Demonstrates API integration without over-reliance
4. **Scalable Architecture**: Caching, indexing, modular structure
5. **Real-World Features**: Export, analytics, predictions
6. **Industry Best Practices**: Error handling, validation, CORS, environment configs

### Key Technical Highlights to Explain

1. **JWT Refresh Token Mechanism**:
   - Access tokens expire in 15 minutes
   - Refresh tokens last 7 days
   - Automatic token refresh on frontend using interceptors
   - Refresh tokens stored in database for revocation capability

2. **MongoDB Aggregation Pipelines**:
   - Category-wise totals using `$group` and `$sum`
   - Month-over-month comparisons with date operators
   - Budget vs actual calculations with joins
   - Overspending detection with conditional logic

3. **Responsible AI Usage**:
   - All calculations done in backend
   - AI receives only processed JSON data
   - System prompts explicitly forbid calculations
   - Responses cached for 24 hours to reduce costs

4. **Security Measures**:
   - Passwords hashed with bcrypt (10 rounds)
   - JWT for stateless authentication
   - CORS configured for specific origins
   - Helmet for HTTP security headers
   - Input validation on all endpoints
   - Parameterized queries (Mongoose prevents injection)

## 📊 Database Schemas

### User
- name, email, password (hashed), refreshToken
- Indexes: email (unique)

### Expense
- userId (ref), amount, category, description, date
- Indexes: userId, date, category, compound index on userId+date

### Budget
- userId (ref), category, monthlyLimit, month (YYYY-MM)
- Unique index: userId + category + month

### AIInsight
- userId (ref), insightType, dataSnapshot, response, expiresAt
- TTL index on expiresAt for automatic cleanup

## 🚧 Troubleshooting

### Backend won't start
- Check if MongoDB URI is correct
- Ensure all environment variables are set
- Check if port 5000 is available

### Frontend can't connect to backend
- Verify VITE_API_URL in frontend `.env`
- Check if backend server is running
- Ensure CORS is configured correctly

### AI insights not generating
- Check if OPENAI_API_KEY is valid
- System works with mock insights if API key is missing
- Verify you have sufficient API credits

## 📝 License

MIT

## 👨‍💻 Author

Created for final year project / portfolio demonstration

---

**Note**: This is a feature-complete expense tracker demonstrating advanced  MERN stack development, suitable for academic projects and professional portfolios.
