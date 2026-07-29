import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        index: true
    },
    otp: {
        type: String,
        required: [true, 'OTP is required']
    },
    expiresAt: {
        type: Date,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 1
    },
    lastSentAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// TTL index — MongoDB automatically deletes expired OTP documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;
