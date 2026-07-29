import { generateGeminiContent } from './geminiService.js';

export const generateFinancialInsights = async (reportData, userName) => {
    try {
        const {
            totalIncome,
            totalExpense,
            totalSavings,
            highestSpendingCategory,
            savingsRate,
            categoryBreakdown
        } = reportData;

        // Basic template fallback in case AI fails
        let fallbackSummary = `Excellent work, ${userName}!\n\n`;
        fallbackSummary += `This month you had a total income of ₹${totalIncome.toFixed(2)} and total expenses of ₹${totalExpense.toFixed(2)}.\n`;
        fallbackSummary += `You saved ₹${totalSavings.toFixed(2)}, which is a savings rate of ${savingsRate.toFixed(1)}%.\n`;
        
        if (highestSpendingCategory !== 'N/A') {
            fallbackSummary += `Your highest spending category was ${highestSpendingCategory}.\n`;
        }
        
        fallbackSummary += `\nKeep tracking your expenses to maintain healthy financial habits!`;

        let fallbackTips = "- Track your daily expenses to identify unnecessary spending patterns.\n- Set spending alerts for your top expense categories.\n- Review and adjust budgets based on actual spending patterns.";
        
        let score = 70; // Default score
        if (savingsRate > 20) score = 90;
        else if (savingsRate > 10) score = 80;
        else if (totalExpense > totalIncome) score = 40;

        const systemPrompt = `You are a professional financial advisor. Generate insights based on the user's monthly spending data. Return the response strictly as a JSON object with three keys: "summary" (a short paragraph of 4-5 sentences, supportive tone, no emojis), "tips" (a bulleted list of 3 actionable saving tips based on their spending, using - for bullets), and "score" (a number between 0 and 100 representing their financial health score based on savings rate and spending). DO NOT wrap the output in markdown blocks, just raw JSON.`;

        const userPrompt = `User Name: ${userName}
Data:
- Total Income: ₹${totalIncome}
- Total Expense: ₹${totalExpense}
- Total Savings: ₹${totalSavings}
- Savings Rate: ${savingsRate.toFixed(2)}%
- Top Category: ${highestSpendingCategory}
- Category Breakdown: ${JSON.stringify(categoryBreakdown.slice(0, 3))}

Generate the JSON response.`;

        const aiResponse = await generateGeminiContent(userPrompt, systemPrompt);
        
        if (aiResponse) {
            try {
                // Strip markdown formatting if Gemini added it despite instructions
                const cleanJsonStr = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanJsonStr);
                return {
                    summary: parsed.summary || fallbackSummary,
                    tips: parsed.tips || fallbackTips,
                    score: parsed.score || score
                };
            } catch (e) {
                console.error("Failed to parse AI JSON response:", e);
                // Fallthrough to fallback
            }
        }

        return {
            summary: fallbackSummary,
            tips: fallbackTips,
            score
        };

    } catch (error) {
        console.error("Error generating financial insights:", error);
        return {
            summary: `Here is your financial summary for the month. You spent ₹${reportData.totalExpense} out of your ₹${reportData.totalIncome} income.`,
            tips: "- Try to stick to your budget limits next month.\n- Review your largest expenses.",
            score: 75
        };
    }
};
