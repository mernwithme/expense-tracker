import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';
import AIHistory from '../models/AIHistory.js';

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
        try {
            return new GoogleGenAI({ apiKey });
        } catch (err) {
            console.error('Failed to initialize GoogleGenAI client:', err);
        }
    }
    return null;
};

export const generateGeminiContent = async (prompt, systemInstruction = '') => {
    const ai = getAiClient();
    if (!ai) return null;

    try {
        const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt
        });
        return response.text;
    } catch (error) {
        console.error('Gemini API call error:', error?.message || error);
        return null;
    }
};

export const analyzeSpendingWithGemini = async (userId, data) => {
    const { totalSpent, totalBudget, categoryTotals, monthlyTrend, topCategory } = data;

    const systemPrompt = `You are ExpenseIQ Pro AI, a professional financial assistant.
Analyze user transactions and budget data to provide actionable insights.
Keep answers concise, clear, and structured in Markdown format.`;

    const userPrompt = `Financial Data:
- Total Spent: ₹${totalSpent || 0}
- Total Budget: ₹${totalBudget || 0}
- Top Category: ${topCategory || 'N/A'}
- Category Totals: ${JSON.stringify(categoryTotals || [])}
- Monthly Trend: ${JSON.stringify(monthlyTrend || [])}

Provide:
1. **Monthly Spending Summary**
2. **Top Spending Category Analysis**
3. **Budget Recommendation**
4. **Actionable Saving Suggestions**`;

    const aiResponse = await generateGeminiContent(userPrompt, systemPrompt);

    let finalResponse = aiResponse;
    if (!finalResponse) {
        finalResponse = `### 📊 Monthly Spending Summary
- **Total Spent**: ₹${totalSpent || 0} against a budget of ₹${totalBudget || 0}.
- **Top Category**: ${topCategory || 'N/A'}, accounting for your largest expenditure.

### 💡 Saving & Budget Suggestions
1. **Track High Spending**: Focus on lowering recurring expenses in your top category (${topCategory || 'General'}).
2. **Budget Allocation**: Allocate no more than 30% of total income to non-essential categories.
3. **Emergency Fund**: Aim to reserve at least 15% of monthly income into high-yield savings.`;
    }

    // Save to AI History safely
    try {
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            await AIHistory.create({
                userId: new mongoose.Types.ObjectId(userId),
                prompt: 'Generate spending summary and analysis',
                response: finalResponse,
                category: 'spending_summary',
                metadata: { dataSnapshot: { totalSpent, totalBudget, topCategory } }
            });
        }
    } catch (e) {
        console.error('Failed to log AI history:', e.message);
    }

    return finalResponse;
};

export const processAIChat = async (userId, userQuery, contextData = {}) => {
    const { totalSpent = 0, totalBudget = 0, categoryTotals = [], monthlyTrend = [] } = contextData;

    const systemInstruction = `You are ExpenseIQ Pro AI Assistant.
Respond accurately to user questions about their financial status, spending habits, savings, and expense predictions.
User's Current Context:
- Total Spent This Month: ₹${totalSpent}
- Total Budget This Month: ₹${totalBudget}
- Category Breakdown: ${JSON.stringify(categoryTotals)}
- Past Monthly Trend: ${JSON.stringify(monthlyTrend)}

Guidelines:
- If asked "Where did I spend the most this month?", pinpoint top category and amount.
- If asked "How much did I save?", calculate total budget minus spent (or income minus spent).
- If asked "Compare this month with last month", summarize monthly trend differences.
- If asked "Predict next month's expenses", give a realistic projection based on average monthly trend.
- Always remain helpful, clear, polite, and use neat Markdown headers and bullet points.`;

    let aiText = await generateGeminiContent(userQuery, systemInstruction);

    if (!aiText) {
        const lowerQ = userQuery.toLowerCase();
        if (lowerQ.includes('where') && lowerQ.includes('most')) {
            const top = categoryTotals[0];
            aiText = top 
                ? `You spent the most in **${top.category}** with a total of **₹${top.total}** this month.`
                : `You don't have recorded expenses for this month yet.`;
        } else if (lowerQ.includes('save') || lowerQ.includes('saved')) {
            const savings = Math.max(0, totalBudget - totalSpent);
            aiText = `Based on your budget of ₹${totalBudget} and spending of ₹${totalSpent}, your current estimated savings is **₹${savings}**.`;
        } else if (lowerQ.includes('compare') || lowerQ.includes('last month')) {
            if (monthlyTrend.length >= 2) {
                const cur = monthlyTrend[monthlyTrend.length - 1];
                const prev = monthlyTrend[monthlyTrend.length - 2];
                const diff = cur.total - prev.total;
                const changeStr = diff > 0 ? `higher by ₹${diff}` : `lower by ₹${Math.abs(diff)}`;
                aiText = `**Monthly Comparison**:\n- **${cur.monthName}**: ₹${cur.total}\n- **${prev.monthName}**: ₹${prev.total}\n\nYour spending in ${cur.monthName} is **${changeStr}** compared to ${prev.monthName}.`;
            } else {
                aiText = `You need at least 2 months of transaction history for a comparison. Currently tracking: ₹${totalSpent} spent this month.`;
            }
        } else if (lowerQ.includes('predict') || lowerQ.includes('next month')) {
            const avg = monthlyTrend.length > 0
                ? Math.round(monthlyTrend.reduce((acc, m) => acc + m.total, 0) / monthlyTrend.length)
                : totalSpent;
            aiText = `### 🔮 Expense Prediction\nBased on your previous spending patterns, your predicted expenses for next month will be approximately **₹${avg || totalSpent}**. We recommend maintaining a budget buffer of ₹${Math.round(avg * 0.1)}.`;
        } else if (lowerQ.includes('reduce') || lowerQ.includes('tips')) {
            aiText = `### 💡 Recommendations to Reduce Spending:\n1. **Limit Non-Essentials**: Audit subscriptions and entertainment expenses.\n2. **Category Cap**: Set strict budget limits on your highest spending category.\n3. **Wait 24 Hours**: Apply a 24-hour cooling-off rule for non-urgent online orders.`;
        } else {
            aiText = `I analyzed your spending data. You have spent **₹${totalSpent}** out of your **₹${totalBudget}** budget this month. Feel free to ask me about your highest spending categories, savings, predictions, or ways to cut down expenses!`;
        }
    }

    // Save to AI History safely
    try {
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            await AIHistory.create({
                userId: new mongoose.Types.ObjectId(userId),
                prompt: userQuery,
                response: aiText,
                category: 'chat',
                metadata: { contextSnapshot: { totalSpent, totalBudget } }
            });
        }
    } catch (e) {
        console.error('Failed to log AI chat history:', e.message);
    }

    return aiText;
};

export default {
    generateGeminiContent,
    analyzeSpendingWithGemini,
    processAIChat
};
