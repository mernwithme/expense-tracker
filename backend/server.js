import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import ocrRoutes from './routes/ocrRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { initializeScheduler } from './services/monthlyReportScheduler.js';
import { verifyTransporter } from './services/emailService.js';

dotenv.config();

const app = express();

connectDB();

app.use(helmet());
const staticOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://expense-tracker-xhee3rmtm-mernwithmes-projects.vercel.app',
    'https://expense-tracker-red-seven-55.vercel.app'
];

const envOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : [];

const allowedOrigins = [...staticOrigins, ...envOrigins].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
        if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);
        if (/^https:\/\/.*\.onrender\.com$/.test(origin) || /^https:\/\/.*\.render\.com$/.test(origin)) return callback(null, true);
        return callback(null, false);
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'ExpenseIQ API is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/expenses/ocr', ocrRoutes);
app.use('/api/expenses/voice', voiceRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/reports', reportRoutes);

app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.use((err, req, res, next) => {
    console.error('Global error handler:', err);

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors
        });
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `${field} already exists`
        });
    }
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API: http://localhost:${PORT}`);
    console.log(`💚 Health: http://localhost:${PORT}/health\n`);
    
    // Initialize scheduled tasks
    initializeScheduler();

    // Verify SMTP connection pool on startup
    verifyTransporter();
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    process.exit(1);
});
