import User from '../models/User.js';
import ReportHistory from '../models/ReportHistory.js';
import { processMonthlyReports } from '../services/monthlyReportScheduler.js';

/**
 * Get user's email preferences
 */
export const getPreferences = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Return default preferences if not set
        const preferences = user.emailPreferences || {
            monthlyReport: true,
            budgetAlerts: true,
            aiInsights: true
        };

        res.status(200).json({
            success: true,
            data: { preferences }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching preferences', error: error.message });
    }
};

/**
 * Update user's email preferences
 */
export const updatePreferences = async (req, res) => {
    try {
        const { monthlyReport, budgetAlerts, aiInsights } = req.body;
        
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.emailPreferences = {
            monthlyReport: monthlyReport !== undefined ? monthlyReport : true,
            budgetAlerts: budgetAlerts !== undefined ? budgetAlerts : true,
            aiInsights: aiInsights !== undefined ? aiInsights : true
        };

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Preferences updated successfully',
            data: { preferences: user.emailPreferences }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating preferences', error: error.message });
    }
};

/**
 * Get user's report history
 */
export const getReportHistory = async (req, res) => {
    try {
        const history = await ReportHistory.find({ userId: req.user.userId })
            .sort({ year: -1, month: -1 })
            .limit(12);

        res.status(200).json({
            success: true,
            data: { history }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching report history', error: error.message });
    }
};

/**
 * Manual trigger for current month (Admin/Dev or User testing)
 */
export const triggerReport = async (req, res) => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Start processing asynchronously in background
        processMonthlyReports(currentMonth, currentYear);

        res.status(200).json({
            success: true,
            message: `Monthly report generation triggered for ${currentMonth}/${currentYear}. Processing in background.`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error triggering report', error: error.message });
    }
};
