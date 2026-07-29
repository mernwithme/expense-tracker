import cron from 'node-cron';
import User from '../models/User.js';
import ReportHistory from '../models/ReportHistory.js';
import { getMonthlyReportData } from './reportDataService.js';
import { generateFinancialInsights } from './aiInsightService.js';
import { generateMonthlyReportPDF } from './pdfReportService.js';
import { sendMonthlyStatementEmail } from './emailService.js';

export const processMonthlyReports = async (monthToProcess, yearToProcess) => {
    console.log(`[Scheduler] Starting monthly report generation for ${monthToProcess}/${yearToProcess}`);
    
    try {
        // Find eligible users: Email verified AND opted into monthly reports
        const users = await User.find({
            emailVerified: true,
            'emailPreferences.monthlyReport': true
        });

        console.log(`[Scheduler] Found ${users.length} eligible users for reports.`);

        const BATCH_SIZE = 10;
        for (let i = 0; i < users.length; i += BATCH_SIZE) {
            const batch = users.slice(i, i + BATCH_SIZE);
            
            await Promise.all(batch.map(async (user) => {
                try {
                    // 1. Check if report already exists for this month/year
                    const existingReport = await ReportHistory.findOne({
                        userId: user._id,
                        month: monthToProcess,
                        year: yearToProcess,
                        status: 'sent'
                    });

                    if (existingReport) {
                        console.log(`[Scheduler] Skipping user ${user._id} - Report already sent.`);
                        return;
                    }

                    // 2. Fetch Report Data
                    const reportData = await getMonthlyReportData(user._id, monthToProcess, yearToProcess);

                    // Skip if no transactions
                    if (reportData.transactionCount === 0) {
                        console.log(`[Scheduler] Skipping user ${user._id} - No transactions this month.`);
                        return;
                    }

                    // Create pending history record (upsert)
                    let historyRecord = await ReportHistory.findOne({
                        userId: user._id, month: monthToProcess, year: yearToProcess
                    });
                    
                    if (!historyRecord) {
                        historyRecord = await ReportHistory.create({
                            userId: user._id,
                            month: monthToProcess,
                            year: yearToProcess,
                            status: 'pending'
                        });
                    }

                    // 3. Generate AI Insights
                    const aiInsights = await generateFinancialInsights(reportData, user.name);

                    // 4. Generate PDF Buffer
                    const pdfBuffer = await generateMonthlyReportPDF(user, reportData, aiInsights, monthToProcess, yearToProcess);

                    // 5. Send Email
                    await sendMonthlyStatementEmail(user.email, user.name, monthToProcess, yearToProcess, pdfBuffer);

                    // 6. Update History
                    historyRecord.status = 'sent';
                    historyRecord.emailedAt = new Date();
                    await historyRecord.save();

                    console.log(`[Scheduler] Successfully sent report to ${user.email}`);

                } catch (userErr) {
                    console.error(`[Scheduler] Error processing user ${user._id}:`, userErr.message);
                    
                    // Log failure
                    await ReportHistory.findOneAndUpdate(
                        { userId: user._id, month: monthToProcess, year: yearToProcess },
                        { 
                            $set: { status: 'failed' },
                            $inc: { retryCount: 1 }
                        },
                        { upsert: true }
                    );
                }
            }));
        }

        console.log(`[Scheduler] Finished processing monthly reports.`);
    } catch (error) {
        console.error('[Scheduler] Critical error in processMonthlyReports:', error);
    }
};

const isLastDayOfMonth = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // If tomorrow is the 1st of a month, then today is the last day
    return tomorrow.getDate() === 1;
};

export const initializeScheduler = () => {
    // Run at 23:59 on days 28-31 of every month
    cron.schedule('59 23 28-31 * *', async () => {
        if (!isLastDayOfMonth()) {
            return; // Skip if it's not actually the last day (e.g. Feb 28th on a leap year)
        }

        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();

        await processMonthlyReports(currentMonth, currentYear);
    });

    console.log('🗓️ Monthly Report Scheduler initialized.');
};
