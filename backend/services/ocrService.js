import Tesseract from 'tesseract.js';

export const processReceiptOCR = async (imageBufferOrPath) => {
    try {
        const { data: { text } } = await Tesseract.recognize(imageBufferOrPath, 'eng', {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    // Option to track progress if needed
                }
            }
        });

        const extracted = parseReceiptText(text || '');
        return {
            success: true,
            rawText: text,
            data: extracted
        };
    } catch (error) {
        console.error('Tesseract OCR error:', error);
        return {
            success: false,
            error: error.message || 'Failed to scan receipt image',
            data: {
                merchantName: 'Unknown Merchant',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                gst: '',
                category: 'Others',
                items: []
            }
        };
    }
};

export const parseReceiptText = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Merchant Name: usually line 1 or 2
    let merchantName = 'Store / Merchant';
    if (lines.length > 0) {
        // filter out pure numbers/dates from being merchant name
        const candidate = lines.find(l => /[a-zA-Z]{3,}/.test(l) && !/total|date|tax|gst|receipt|invoice/i.test(l));
        if (candidate) merchantName = candidate;
    }

    // Amount extraction
    let amount = 0;
    const amountRegexes = [
        /(?:total|grand\s*total|net\s*amount|amount\s*paid|paid|due|rs\.?|₹)\s*[:=]?\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
        /([0-9]+\.[0-9]{2})/g
    ];

    for (const line of lines) {
        const match = line.match(/(?:total|grand\s*total|net\s*amount|amount\s*paid|paid|due|rs\.?|₹)\s*[:=]?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
        if (match && match[1]) {
            const parsed = parseFloat(match[1]);
            if (parsed > amount) amount = parsed;
        }
    }

    if (amount === 0) {
        // Fallback: find max 2-decimal floating number in entire text
        const matches = text.match(/\b\d+\.\d{2}\b/g);
        if (matches) {
            const numbers = matches.map(n => parseFloat(n)).filter(n => !isNaN(n) && n < 1000000);
            if (numbers.length > 0) {
                amount = Math.max(...numbers);
            }
        }
    }

    // Date extraction
    let dateStr = new Date().toISOString().split('T')[0];
    const dateMatch = text.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(\d{4}[/-]\d{1,2}[/-]\d{1,2})/);
    if (dateMatch) {
        try {
            const parsedDate = new Date(dateMatch[0]);
            if (!isNaN(parsedDate.getTime())) {
                dateStr = parsedDate.toISOString().split('T')[0];
            }
        } catch (e) {
            // ignore invalid date parse
        }
    }

    // GST Extraction
    let gstStr = '';
    const gstMatch = text.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{3}\b/) || text.match(/GSTIN\s*[:=]?\s*([A-Z0-9]+)/i);
    if (gstMatch) {
        gstStr = gstMatch[1] || gstMatch[0];
    }

    // Category Heuristics
    let category = 'Others';
    const lowerText = text.toLowerCase();
    if (/restaurant|cafe|coffee|pizza|burger|dining|food|kitchen|baking|swiggy|zomato|mcdonald|starbucks|domino|hotel/i.test(lowerText)) {
        category = 'Food';
    } else if (/petrol|diesel|fuel|hpcl|bpcl|iocl|shell|oil|gas station/i.test(lowerText)) {
        category = 'Travel';
    } else if (/supermarket|grocery|hypermarket|mart|store|provisions|bazaar|retail/i.test(lowerText)) {
        category = 'Food';
    } else if (/amazon|flipkart|zara|h&m|apparel|clothing|fashion|shopping|mall/i.test(lowerText)) {
        category = 'Shopping';
    } else if (/cinema|movie|theatre|game|bowling|concert|ticket|entertainment/i.test(lowerText)) {
        category = 'Entertainment';
    } else if (/pharmacy|hospital|doctor|clinic|medical|medicine|healthcare/i.test(lowerText)) {
        category = 'Healthcare';
    } else if (/electricity|water|wifi|broadband|recharge|mobile|bill/i.test(lowerText)) {
        category = 'Bills';
    } else if (/school|college|course|udemy|tuition|book|education/i.test(lowerText)) {
        category = 'Education';
    }

    // Items list (extract non-empty itemized lines)
    const items = lines
        .filter(l => /\b\d+(\.\d{2})?\b/.test(l) && !/total|tax|subtotal|cash|change|gst/i.test(l))
        .slice(0, 5);

    return {
        merchantName,
        amount,
        date: dateStr,
        gst: gstStr,
        category,
        items
    };
};

export default {
    processReceiptOCR,
    parseReceiptText
};
