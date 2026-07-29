import { processReceiptOCR } from '../services/ocrService.js';
import ReceiptImage from '../models/ReceiptImage.js';

export const scanReceipt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Receipt image file is required'
            });
        }

        const buffer = req.file.buffer;
        const result = await processReceiptOCR(buffer);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error || 'Failed to parse receipt'
            });
        }

        // Store metadata record in MongoDB
        let receiptRecord = null;
        try {
            receiptRecord = await ReceiptImage.create({
                userId: req.user.userId,
                originalName: req.file.originalname || 'receipt.png',
                imageUrl: `data:${req.file.mimetype};base64,${buffer.toString('base64').slice(0, 100)}...`,
                extractedData: result.data
            });
        } catch (dbErr) {
            console.error('Failed to log ReceiptImage record:', dbErr.message);
        }

        res.status(200).json({
            success: true,
            message: 'Receipt scanned successfully',
            data: {
                ...result.data,
                receiptId: receiptRecord?._id || null
            }
        });
    } catch (error) {
        console.error('OCR Controller Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing receipt scan',
            error: error.message
        });
    }
};

export default {
    scanReceipt
};
