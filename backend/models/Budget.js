import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: ['Food', 'Travel', 'Rent', 'Shopping', 'Entertainment', 'Healthcare', 'Bills', 'Education', 'Others'],
            message: '{VALUE} is not a valid category'
        }
    },
    monthlyLimit: {
        type: Number,
        required: [true, 'Monthly limit is required'],
        min: [0, 'Monthly limit must be greater than or equal to 0'],
        validate: {
            validator: function (value) {
                return Number.isFinite(value) && value >= 0;
            },
            message: 'Monthly limit must be a valid non-negative number'
        }
    },
    month: {
        type: String,
        required: [true, 'Month is required'],
        match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'],
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound unique index: one budget per category per month per user
budgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
budgetSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Budget = mongoose.model('Budget', budgetSchema);

export default Budget;
