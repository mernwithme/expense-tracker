# Quick Start Guide

## Prerequisites Checklist
- [ ] Node.js v16+ installed (`node --version`)
- [ ] MongoDB Atlas account created
- [ ] (Optional) OpenAI API key

## Step 1: MongoDB Atlas Setup (5 minutes)

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Create a cluster (free M0 tier)
4. Click "Connect" → "Connect your application"
5. Copy connection string: `mongodb+srv://<username>:<password>@cluster...`
6. Replace `<username>` and `<password>` with your credentials

## Step 2: Environment Setup

### Backend (.env)
```bash
cd backend
copy .env.example .env
```

Edit `.env`:
```env
MONGODB_URI=your_mongodb_connection_string_here
JWT_ACCESS_SECRET=any_random_string_min_32_chars_abc123xyz456
JWT_REFRESH_SECRET=different_random_string_min_32_chars_def789uvw012
OPENAI_API_KEY=sk-your-key-or-leave-as-is-for-mock-data
```

### Frontend (.env)
```bash
cd frontend
copy .env.example .env
```

Already configured to `http://localhost:5000/api` - no changes needed.

## Step 3: Installation

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 4: Run the Application

### Terminal 1 - Start Backend
```bash
cd backend
npm run dev
```
Should see: `✅ MongoDB Connected` and `🚀 Server is running on port 5000`

### Terminal 2 - Start Frontend
```bash
cd frontend
npm run dev
```
Should see: `Local: http://localhost:5173/`

## Step 5: First Login

1. Open browser: `http://localhost:5173`
2. Click "Sign up"
3. Create account (any email format, password 6+ chars)
4. Auto-redirected to dashboard

## Testing the Features

### Add Expenses
1. Click "Add New Expense" or go to `/expenses`
2. Fill: Amount, Category, Description, Date
3. Submit

### Set Budgets
1. Click "Set Budgets" or go to `/budgets`
2. Select category, enter monthly limit
3. Submit

### View Analytics
- Dashboard shows category breakdown
- Monthly trend chart
- Budget progress

### AI Insights
1. Click "AI Insights"
2. Click "Generate Insights"
3. View spending analysis and tips

### Export Reports
1. Go to dashboard
2. Click "Export CSV" or "Export PDF"
3. File downloads automatically

## Troubleshooting

### Backend won't start
- **Error: connect ECONNREFUSED**
  → Check MongoDB URI in `.env`
  → Ensure IP is whitelisted in Atlas (Network Access)

- **Port 5000 already in use**
  → Change `PORT=5001` in `.env`

### Frontend can't connect
- **Network Error**
  → Check backend is running
  → Verify `VITE_API_URL` in frontend `.env`

### Login/Register fails
- **MongoDB connection error**
  → Check MongoDB Atlas credentials
  → Verify cluster is running (not paused)

## Quick Commands Reference

```bash
# Backend
cd backend
npm install          # Install dependencies
npm run dev          # Start dev server
npm start            # Start production server

# Frontend
cd frontend
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
```

## Default Categories
- Food
- Travel
- Rent
- Shopping
- Entertainment
- Healthcare
- Bills
- Education
- Others

## API Health Check
Open: `http://localhost:5000/health`
Should return: `{ "success": true, "message": "Server is running" }`

## Next Steps
1. Add 5-10 sample expenses
2. Set budgets for top 3 categories
3. Generate AI insights
4. Export a report
5. Review viva questions in `VIVA_QUESTIONS.md`

## Support
If you encounter issues:
1. Check both terminals for errors
2. Verify `.env` variables are set
3. Ensure MongoDB connection is active
4. Try clearing browser cache/localStorage

---

**You're all set!** The application should be fully functional. Start by registering a new account and exploring the features.
