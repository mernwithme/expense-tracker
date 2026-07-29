export const parseVoiceText = (text) => {
    if (!text || typeof text !== 'string') {
        return {
            amount: 0,
            category: 'Food',
            description: '',
            date: new Date().toISOString().split('T')[0],
            type: 'Expense'
        };
    }

    const cleanText = text.trim();
    const lower = cleanText.toLowerCase();

    // 1. Amount Extraction
    let amount = 0;
    // Matches ₹350, 350 rupees, 350 rs, 350 dollars, or standalone numbers
    const amountMatch = cleanText.match(/(?:₹|rs\.?|rupees|inr|\$)?\s*([0-9]+(?:\.[0-9]{1,2})?)\s*(?:rupees|rs\.?|inr|\$)?/i);
    if (amountMatch && amountMatch[1]) {
        amount = parseFloat(amountMatch[1]);
    }

    // 2. Type Detection
    let type = 'Expense';
    if (/\bsalary|income|earned|received|credit|paycheck\b/i.test(lower)) {
        type = 'Income';
    }

    // 3. Category Detection
    let category = 'Others';
    if (/pizza|burger|food|dinner|lunch|breakfast|restaurant|swiggy|zomato|coffee|tea|snacks|grocery|eat|meal/i.test(lower)) {
        category = 'Food';
    } else if (/rent|flat|house|apartment/i.test(lower)) {
        category = 'Rent';
    } else if (/petrol|diesel|fuel|cab|uber|ola|travel|flight|train|bus|ticket|fare|auto/i.test(lower)) {
        category = 'Travel';
    } else if (/shopping|clothes|shoes|dress|amazon|flipkart|mall|buy|bought/i.test(lower)) {
        category = 'Shopping';
    } else if (/movie|cinema|game|party|entertainment|show/i.test(lower)) {
        category = 'Entertainment';
    } else if (/doctor|medicine|hospital|pharmacy|clinic|medical|health/i.test(lower)) {
        category = 'Healthcare';
    } else if (/bill|electricity|water|wifi|broadband|recharge|mobile|phone/i.test(lower)) {
        category = 'Bills';
    } else if (/school|college|fee|course|book|tuition|education/i.test(lower)) {
        category = 'Education';
    }

    // 4. Date Extraction
    let date = new Date().toISOString().split('T')[0];
    if (/\byesterday\b/i.test(lower)) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        date = d.toISOString().split('T')[0];
    }

    // 5. Description
    let description = cleanText;
    // Strip common filler words for clean description if needed
    if (cleanText.length > 50) {
        description = cleanText.slice(0, 100);
    }

    return {
        amount,
        category,
        description,
        date,
        type
    };
};

export default {
    parseVoiceText
};
