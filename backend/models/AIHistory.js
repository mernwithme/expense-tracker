import mongoose from 'mongoose';

const aiHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    prompt: {
        type: String,
        required: [true, 'Prompt is required'],
        maxlength: [2000, 'Prompt cannot exceed 2000 characters']
    },
    response: {
        type: String,
        required: [true, 'Response is required'],
        maxlength: [10000, 'Response cannot exceed 10000 characters']
    },
    category: {
        type: String,
        enum: ['chat', 'spending_summary', 'saving_tips', 'budget_recommendation', 'monthly_comparison', 'expense_prediction', 'general'],
        default: 'chat'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

aiHistorySchema.index({ userId: 1, createdAt: -1 });

const AIHistory = mongoose.model('AIHistory', aiHistorySchema);

export default AIHistory;
