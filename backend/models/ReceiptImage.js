import mongoose from 'mongoose';

const receiptImageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    originalName: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    extractedData: {
        merchantName: { type: String, default: '' },
        amount: { type: Number, default: 0 },
        date: { type: String, default: '' },
        gst: { type: String, default: '' },
        category: { type: String, default: 'Others' },
        items: [{ type: String }],
        rawText: { type: String, default: '' }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const ReceiptImage = mongoose.model('ReceiptImage', receiptImageSchema);

export default ReceiptImage;
