import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0'],
        validate: {
            validator: function (value) {
                return Number.isFinite(value) && value > 0;
            },
            message: 'Amount must be a valid positive number'
        }
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: ['Food', 'Travel', 'Rent', 'Shopping', 'Entertainment', 'Healthcare', 'Bills', 'Education', 'Others'],
            message: '{VALUE} is not a valid category'
        },
        index: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now,
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

// Compound index for efficient queries by user and date
expenseSchema.index({ userId: 1, date: -1 });

// Compound index for category-wise queries
expenseSchema.index({ userId: 1, category: 1, date: -1 });

// Update the updatedAt timestamp before saving
expenseSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
