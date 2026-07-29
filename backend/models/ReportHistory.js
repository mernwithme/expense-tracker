import mongoose from 'mongoose';

const reportHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    month: {
        type: Number, // 1-12
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    emailedAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    },
    retryCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound unique index to prevent duplicate reports for the same user per month/year
reportHistorySchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

const ReportHistory = mongoose.model('ReportHistory', reportHistorySchema);

export default ReportHistory;
