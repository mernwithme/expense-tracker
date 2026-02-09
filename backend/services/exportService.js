import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';

/**
 * Generate CSV from expenses array
 */
export const generateCSV = (expenses, summary = {}) => {
    try {
        // Define fields for CSV
        const fields = [
            { label: 'Date', value: 'date' },
            { label: 'Category', value: 'category' },
            { label: 'Amount', value: 'amount' },
            { label: 'Description', value: 'description' }
        ];

        // Format expenses data
        const formattedExpenses = expenses.map(expense => ({
            date: new Date(expense.date).toLocaleDateString('en-IN'),
            category: expense.category,
            amount: `₹${expense.amount.toFixed(2)}`,
            description: expense.description
        }));

        // Create CSV parser
        const parser = new Parser({ fields });
        let csv = parser.parse(formattedExpenses);

        // Add summary section if provided
        if (summary.total) {
            csv += '\n\n--- SUMMARY ---\n';
            csv += `Total Expenses,₹${summary.total.toFixed(2)}\n`;
            csv += `Expense Count,${summary.count}\n`;
            if (summary.avgExpense) {
                csv += `Average Expense,₹${summary.avgExpense.toFixed(2)}\n`;
            }
        }

        return csv;

    } catch (error) {
        console.error('CSV generation error:', error);
        throw new Error('Failed to generate CSV');
    }
};

/**
 * Generate PDF from expenses array
 */
export const generatePDF = (expenses, summary = {}, userName = 'User') => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            // Collect PDF chunks
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).font('Helvetica-Bold')
                .text('Expense Report', { align: 'center' });

            doc.moveDown(0.5);
            doc.fontSize(12).font('Helvetica')
                .text(`Generated for: ${userName}`, { align: 'center' });
            doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });

            doc.moveDown(1);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);

            // Summary section
            if (summary.total) {
                doc.fontSize(16).font('Helvetica-Bold')
                    .text('Summary', { underline: true });
                doc.moveDown(0.5);

                doc.fontSize(10).font('Helvetica')
                    .text(`Total Expenses: ₹${summary.total.toFixed(2)}`);
                doc.text(`Number of Transactions: ${summary.count}`);

                if (summary.avgExpense) {
                    doc.text(`Average Expense: ₹${summary.avgExpense.toFixed(2)}`);
                }

                if (summary.startDate && summary.endDate) {
                    doc.text(`Period: ${new Date(summary.startDate).toLocaleDateString('en-IN')} to ${new Date(summary.endDate).toLocaleDateString('en-IN')}`);
                }

                doc.moveDown(1);
                doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown(1);
            }

            // Expenses table
            doc.fontSize(16).font('Helvetica-Bold')
                .text('Expense Details', { underline: true });
            doc.moveDown(0.5);

            // Table header
            const tableTop = doc.y;
            const col1X = 50;
            const col2X = 150;
            const col3X = 250;
            const col4X = 350;

            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Date', col1X, tableTop);
            doc.text('Category', col2X, tableTop);
            doc.text('Amount', col3X, tableTop);
            doc.text('Description', col4X, tableTop);

            doc.moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.3);

            // Table rows
            doc.font('Helvetica').fontSize(9);

            expenses.forEach((expense, index) => {
                const y = doc.y;

                // Check if we need a new page
                if (y > 700) {
                    doc.addPage();
                    doc.y = 50;
                }

                doc.text(new Date(expense.date).toLocaleDateString('en-IN'), col1X, doc.y);
                doc.text(expense.category, col2X, y);
                doc.text(`₹${expense.amount.toFixed(2)}`, col3X, y);
                doc.text(expense.description.substring(0, 30), col4X, y);

                doc.moveDown(0.8);

                // Add separator line every 5 rows
                if ((index + 1) % 5 === 0) {
                    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                    doc.moveDown(0.3);
                }
            });

            // Footer
            const pageCount = doc.bufferedPageRange();
            for (let i = 0; i < pageCount.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).font('Helvetica')
                    .text(
                        `Page ${i + 1} of ${pageCount.count}`,
                        50,
                        doc.page.height - 50,
                        { align: 'center' }
                    );
            }

            doc.end();

        } catch (error) {
            console.error('PDF generation error:', error);
            reject(new Error('Failed to generate PDF'));
        }
    });
};

export default {
    generateCSV,
    generatePDF
};
