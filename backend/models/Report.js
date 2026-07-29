import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    format: {
        type: String,
        enum: ['pdf', 'excel', 'csv'],
        required: true
    },
    month: {
        type: String,
        required: true
    },
    summary: {
        totalIncome: { type: Number, default: 0 },
        totalExpenses: { type: Number, default: 0 },
        totalSavings: { type: Number, default: 0 },
        highestCategory: { type: String, default: '' },
        expenseCount: { type: Number, default: 0 }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Report = mongoose.model('Report', reportSchema);

export default Report;
