import { parseVoiceText } from '../services/voiceService.js';

export const parseVoiceExpense = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Voice text is required'
            });
        }

        const parsedData = parseVoiceText(text);

        res.status(200).json({
            success: true,
            message: 'Voice text parsed successfully',
            data: parsedData
        });
    } catch (error) {
        console.error('Voice parsing error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to parse voice expense',
            error: error.message
        });
    }
};

export default {
    parseVoiceExpense
};
