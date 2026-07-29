import PDFDocument from 'pdfkit';

export const generateMonthlyReportPDF = (userData, reportData, aiInsights, month, year) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];
            
            doc.on('data', buffer => buffers.push(buffer));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const monthName = monthNames[month - 1];

            // Primary Colors
            const colors = {
                primary: '#4f46e5', // Indigo
                secondary: '#64748b', // Slate
                success: '#10b981', // Emerald
                danger: '#ef4444', // Red
                light: '#f1f5f9',
                dark: '#1e293b'
            };

            // ==========================================
            // PAGE 1: COVER & SUMMARY CARDS
            // ==========================================
            
            // Header
            doc.rect(0, 0, doc.page.width, 120).fill(colors.primary);
            doc.fillColor('white').fontSize(28).font('Helvetica-Bold').text('ExpenseIQ', 50, 40);
            doc.fontSize(14).font('Helvetica').text('Monthly Financial Statement', 50, 75);
            
            doc.fontSize(12).text(`${monthName} ${year}`, doc.page.width - 200, 75, { align: 'right', width: 150 });

            doc.moveDown(4);

            // User Info
            doc.fillColor(colors.dark).fontSize(16).font('Helvetica-Bold').text(`Hello, ${userData.name}`);
            doc.fillColor(colors.secondary).fontSize(10).font('Helvetica').text(`Email: ${userData.email}`);
            doc.moveDown(2);

            // Summary Cards (2x2 grid)
            const drawCard = (x, y, title, value, valueColor) => {
                doc.rect(x, y, 220, 80).fill('#ffffff').stroke('#e2e8f0');
                doc.lineWidth(1).stroke();
                doc.fillColor(colors.secondary).fontSize(12).font('Helvetica').text(title, x + 15, y + 15);
                doc.fillColor(valueColor).fontSize(20).font('Helvetica-Bold').text(`Rs. ${value.toFixed(2)}`, x + 15, y + 40);
            };

            const startY = doc.y;
            drawCard(50, startY, 'Total Income', reportData.totalIncome, colors.success);
            drawCard(300, startY, 'Total Expense', reportData.totalExpense, colors.danger);
            
            drawCard(50, startY + 100, 'Net Savings', reportData.totalSavings, reportData.totalSavings >= 0 ? colors.success : colors.danger);
            drawCard(300, startY + 100, 'Opening Balance', reportData.openingBalance, colors.dark);

            // ==========================================
            // PAGE 2: CHARTS & TRENDS
            // ==========================================
            doc.addPage();
            
            doc.fillColor(colors.dark).fontSize(20).font('Helvetica-Bold').text('Monthly Analytics', 50, 50);
            doc.moveTo(50, 80).lineTo(545, 80).strokeColor(colors.light).stroke();
            doc.moveDown(2);

            // Income vs Expense Bar Chart
            doc.fillColor(colors.dark).fontSize(14).font('Helvetica-Bold').text('Income vs Expense');
            doc.moveDown(1);
            
            const maxVal = Math.max(reportData.totalIncome, reportData.totalExpense, 1);
            const chartWidth = 400;
            const incWidth = (reportData.totalIncome / maxVal) * chartWidth;
            const expWidth = (reportData.totalExpense / maxVal) * chartWidth;

            // Income bar
            doc.rect(50, doc.y, incWidth, 30).fill(colors.success);
            doc.fillColor(colors.dark).fontSize(10).font('Helvetica').text(`Income: Rs. ${reportData.totalIncome.toFixed(2)}`, 50, doc.y + 35);
            doc.moveDown(2);
            
            // Expense bar
            doc.rect(50, doc.y, expWidth, 30).fill(colors.danger);
            doc.fillColor(colors.dark).fontSize(10).font('Helvetica').text(`Expense: Rs. ${reportData.totalExpense.toFixed(2)}`, 50, doc.y + 35);
            
            doc.moveDown(3);

            // Daily Trend (Simple ASCII/Table representation)
            doc.fillColor(colors.dark).fontSize(14).font('Helvetica-Bold').text('Daily Spending Trend');
            doc.moveDown(1);
            
            let trendText = "";
            reportData.weeklySpending.forEach((week, i) => {
                trendText += `Week ${i + 1}: Rs. ${week.toFixed(2)}\n`;
            });
            doc.fillColor(colors.secondary).fontSize(11).font('Helvetica').text(trendText, { lineGap: 5 });

            // ==========================================
            // PAGE 3: CATEGORY BREAKDOWN
            // ==========================================
            doc.addPage();
            
            doc.fillColor(colors.dark).fontSize(20).font('Helvetica-Bold').text('Category Breakdown', 50, 50);
            doc.moveTo(50, 80).lineTo(545, 80).strokeColor(colors.light).stroke();
            doc.moveDown(2);

            const tableTop = doc.y;
            doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.dark);
            doc.text('Category', 50, tableTop);
            doc.text('Amount', 250, tableTop);
            doc.text('% of Total', 450, tableTop);
            
            doc.moveTo(50, tableTop + 20).lineTo(545, tableTop + 20).strokeColor(colors.secondary).stroke();
            
            let rowY = tableTop + 30;
            doc.font('Helvetica').fontSize(11).fillColor(colors.dark);
            
            reportData.categoryBreakdown.forEach((cat) => {
                doc.text(cat.category, 50, rowY);
                doc.text(`Rs. ${cat.amount.toFixed(2)}`, 250, rowY);
                doc.text(`${cat.percentage.toFixed(1)}%`, 450, rowY);
                
                doc.moveTo(50, rowY + 15).lineTo(545, rowY + 15).strokeColor(colors.light).stroke();
                rowY += 25;
            });

            // ==========================================
            // PAGE 4: TOP TRANSACTIONS
            // ==========================================
            doc.addPage();
            
            doc.fillColor(colors.dark).fontSize(20).font('Helvetica-Bold').text('Top 10 Transactions', 50, 50);
            doc.moveTo(50, 80).lineTo(545, 80).strokeColor(colors.light).stroke();
            doc.moveDown(2);

            const topTableTop = doc.y;
            doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.dark);
            doc.text('Date', 50, topTableTop);
            doc.text('Category', 120, topTableTop);
            doc.text('Merchant', 220, topTableTop);
            doc.text('Amount', 450, topTableTop);
            
            doc.moveTo(50, topTableTop + 20).lineTo(545, topTableTop + 20).strokeColor(colors.secondary).stroke();
            
            let topRowY = topTableTop + 30;
            doc.font('Helvetica').fontSize(9).fillColor(colors.dark);
            
            reportData.top10Expenses.forEach((txn) => {
                const dateStr = new Date(txn.date).toLocaleDateString();
                const merchant = (txn.merchant || txn.description || 'Unknown').substring(0, 30);
                
                doc.text(dateStr, 50, topRowY);
                doc.text(txn.category, 120, topRowY);
                doc.text(merchant, 220, topRowY);
                doc.text(`Rs. ${txn.amount.toFixed(2)}`, 450, topRowY);
                
                doc.moveTo(50, topRowY + 15).lineTo(545, topRowY + 15).strokeColor(colors.light).stroke();
                topRowY += 25;
            });

            // ==========================================
            // PAGE 5: AI FINANCIAL INSIGHTS
            // ==========================================
            doc.addPage();
            
            doc.fillColor(colors.primary).fontSize(20).font('Helvetica-Bold').text('AI Financial Insights', 50, 50);
            doc.moveTo(50, 80).lineTo(545, 80).strokeColor(colors.light).stroke();
            doc.moveDown(2);

            // Score Card
            doc.rect(50, doc.y, 495, 80).fill(colors.light);
            doc.fillColor(colors.dark).fontSize(14).font('Helvetica-Bold').text('Financial Health Score', 70, doc.y + 20);
            
            let scoreColor = colors.success;
            if (aiInsights.score < 50) scoreColor = colors.danger;
            else if (aiInsights.score < 80) scoreColor = '#f59e0b'; // Amber

            doc.fillColor(scoreColor).fontSize(30).font('Helvetica-Bold').text(`${aiInsights.score}/100`, 380, doc.y - 15);
            doc.moveDown(4);

            // Summary
            doc.fillColor(colors.dark).fontSize(16).font('Helvetica-Bold').text('Summary');
            doc.moveDown(0.5);
            doc.fillColor(colors.secondary).fontSize(12).font('Helvetica').text(aiInsights.summary, { lineGap: 5, align: 'justify' });
            
            doc.moveDown(2);

            // Recommendations
            doc.fillColor(colors.dark).fontSize(16).font('Helvetica-Bold').text('Recommendations & Saving Tips');
            doc.moveDown(0.5);
            doc.fillColor(colors.secondary).fontSize(12).font('Helvetica').text(aiInsights.tips, { lineGap: 5 });

            // Footer on all pages
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                doc.fillColor(colors.secondary).fontSize(10).font('Helvetica').text(
                    `Page ${i + 1} of ${pages.count} | Generated automatically by ExpenseIQ`,
                    50,
                    doc.page.height - 50,
                    { align: 'center' }
                );
            }

            doc.end();

        } catch (error) {
            console.error('Error generating PDF:', error);
            reject(error);
        }
    });
};
