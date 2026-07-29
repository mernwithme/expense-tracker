import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import XLSX from 'xlsx';

/**
 * Generate CSV from expenses array
 */
export const generateCSV = (expenses, summary = {}) => {
    try {
        const fields = [
            { label: 'Date', value: 'date' },
            { label: 'Category', value: 'category' },
            { label: 'Amount', value: 'amount' },
            { label: 'Description', value: 'description' },
            { label: 'Type', value: 'type' }
        ];

        const formattedExpenses = expenses.map(expense => ({
            date: new Date(expense.date).toLocaleDateString('en-IN'),
            category: expense.category,
            amount: `₹${expense.amount.toFixed(2)}`,
            description: expense.description,
            type: expense.type || 'Expense'
        }));

        const parser = new Parser({ fields });
        let csv = parser.parse(formattedExpenses);

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
 * Generate Excel buffer from expenses array
 */
export const generateExcel = (expenses, summary = {}) => {
    try {
        const data = expenses.map(expense => ({
            Date: new Date(expense.date).toLocaleDateString('en-IN'),
            Category: expense.category,
            Amount: expense.amount,
            Description: expense.description,
            Type: expense.type || 'Expense'
        }));

        if (summary.total) {
            data.push({});
            data.push({
                Category: '--- SUMMARY ---',
                Amount: `Total: ₹${summary.total.toFixed(2)}`,
                Description: `Count: ${summary.count}`
            });
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    } catch (error) {
        console.error('Excel generation error:', error);
        throw new Error('Failed to generate Excel file');
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

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).font('Helvetica-Bold')
                .text('ExpenseIQ - Financial Report', { align: 'center' });

            doc.moveDown(0.5);
            doc.fontSize(12).font('Helvetica')
                .text(`Generated for: ${userName}`, { align: 'center' });
            doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });

            doc.moveDown(1);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);

            // Summary section
            if (summary.total !== undefined) {
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

            doc.font('Helvetica').fontSize(9);

            expenses.forEach((expense, index) => {
                const y = doc.y;

                if (y > 700) {
                    doc.addPage();
                    doc.y = 50;
                }

                doc.text(new Date(expense.date).toLocaleDateString('en-IN'), col1X, doc.y);
                doc.text(expense.category, col2X, y);
                doc.text(`₹${expense.amount.toFixed(2)}`, col3X, y);
                doc.text(expense.description.substring(0, 30), col4X, y);

                doc.moveDown(0.8);

                if ((index + 1) % 5 === 0) {
                    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                    doc.moveDown(0.3);
                }
            });

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
    generateExcel,
    generatePDF
};
