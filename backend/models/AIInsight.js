import mongoose from 'mongoose';

const aiInsightSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    insightType: {
        type: String,
        required: [true, 'Insight type is required'],
        enum: ['spending_analysis', 'budget_optimization', 'prediction', 'general'],
        default: 'general'
    },
    dataSnapshot: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Data snapshot is required'],
        // Stores the processed data that was sent to AI
        // Example: { categoryTotals: {...}, monthlyTrend: [...], budgetStatus: [...] }
    },
    response: {
        type: String,
        required: [true, 'AI response is required'],
        maxlength: [5000, 'Response cannot exceed 5000 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        // Default: insights expire after 24 hours
        // Index is created by TTL index below
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
}, {
    timestamps: true
});

// Compound index for efficient cache lookups
aiInsightSchema.index({ userId: 1, insightType: 1, createdAt: -1 });

// TTL index to automatically delete expired insights
aiInsightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to find recent valid insights
aiInsightSchema.statics.findRecentInsight = async function (userId, insightType, maxAgeHours = 24) {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

    return this.findOne({
        userId,
        insightType,
        createdAt: { $gte: cutoffTime },
        expiresAt: { $gt: new Date() }
    })
        .sort({ createdAt: -1 })
        .exec();
};

const AIInsight = mongoose.model('AIInsight', aiInsightSchema);

export default AIInsight;
