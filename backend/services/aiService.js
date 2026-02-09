import OpenAI from 'openai';

let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here') {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}

export const generateSpendingInsights = async (data) => {
    try {
        
        if (!openai) {
            return generateMockInsights(data);
        }

        const {
            budget,
            totalSpent,
            overspentAmount,
            remainingAmount,
            topCategory,
            topCategoryPercentage,
            secondCategory
        } = data;

        const systemPrompt = `You are a financial assistant integrated into an expense tracking application.

You will receive structured expense analysis data calculated by the backend.
Your task is to generate clear, concise, and user-friendly financial insights.
Do NOT perform calculations. Only explain and recommend based on the data provided.`;

        const userPrompt = `User Expense Summary:
- Monthly Budget: ₹${budget}
- Total Spent This Month: ₹${totalSpent}
- Overspent Amount: ₹${overspentAmount}
- Remaining Amount: ₹${remainingAmount}
- Top Spending Category: ${topCategory}
- Percentage Spent on Top Category: ${topCategoryPercentage}%
- Second Highest Category (if any): ${secondCategory}

Instructions:
1. Clearly mention if the user has exceeded the budget.
2. Identify the main reason for overspending using category data.
3. Give 1–2 practical, realistic recommendations.
4. Keep the tone supportive and simple.
5. Limit the response to 4–6 sentences.
6. Do NOT use emojis.
7. Do NOT include headings.

Generate the AI insight text now.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 300
        });

        return completion.choices[0].message.content;

    } catch (error) {
        console.error('OpenAI API error:', error);

        return generateMockInsights(data);
    }
};

export const generateSavingTips = async (categoryTotals, budgetStatus) => {
    try {
        if (!openai) {
            return generateMockSavingTips(categoryTotals);
        }

        const prompt = `Based on the following spending data, provide 5 personalized money-saving tips:

Category Spending: ${JSON.stringify(categoryTotals, null, 2)}
Budget Status: ${JSON.stringify(budgetStatus, null, 2)}

Requirements:
- Tips should be specific to the categories where user spends most
- Be practical and actionable
- Keep each tip to 1-2 sentences
- Format as a numbered list`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a financial advisor providing practical saving tips.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 500
        });

        return completion.choices[0].message.content;

    } catch (error) {
        console.error('OpenAI API error:', error);
        return generateMockSavingTips(categoryTotals);
    }
};

export const predictOverspendingRisk = async (monthlyTrend, currentMonthSpending, budgets) => {
    try {
        if (!openai) {
            return generateMockPrediction(monthlyTrend, currentMonthSpending);
        }

        const prompt = `Analyze spending trends and predict overspending risk:

Monthly Trend: ${JSON.stringify(monthlyTrend, null, 2)}
Current Month Spending: ${JSON.stringify(currentMonthSpending, null, 2)}
Budgets: ${JSON.stringify(budgets, null, 2)}

Provide:
1. Overall risk level (Low/Medium/High)
2. Categories at risk
3. Specific warning signs you notice
4. Recommended preventive actions

Keep response concise and clear.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a financial risk analyst predicting spending risks.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.6,
            max_tokens: 400
        });

        return completion.choices[0].message.content;

    } catch (error) {
        console.error('OpenAI API error:', error);
        return generateMockPrediction(monthlyTrend, currentMonthSpending);
    }
};

function generateMockInsights(data) {
    const { categoryTotals, monthlyTrend, budgetStatus } = data;

    let insights = "## 📊 Spending Pattern Analysis\n\n";

    if (categoryTotals && categoryTotals.length > 0) {
        const topCategory = categoryTotals[0];
        insights += `- Your highest spending category is **${topCategory.category}** with ₹${topCategory.total}\n`;
        insights += `- You have expenses across ${categoryTotals.length} different categories\n`;
    }

    insights += "\n## 💰 Budget Performance\n\n";

    if (budgetStatus && budgetStatus.length > 0) {
        const overspent = budgetStatus.filter(b => b.isOverspent);
        if (overspent.length > 0) {
            insights += `- ⚠️ You've exceeded budget in ${overspent.length} categories\n`;
            overspent.forEach(b => {
                insights += `  - ${b.category}: ₹${b.actual} / ₹${b.monthlyLimit}\n`;
            });
        } else {
            insights += "- ✅ You're staying within budget across all categories\n";
        }
    }

    insights += "\n## 💡 Optimization Suggestions\n\n";
    insights += "1. Track daily expenses to identify unnecessary spending patterns\n";
    insights += "2. Set spending alerts for your top expense categories\n";
    insights += "3. Review and adjust budgets based on actual spending patterns\n";

    insights += "\n## 🔮 Future Predictions\n\n";
    if (monthlyTrend && monthlyTrend.length >= 2) {
        const lastMonth = monthlyTrend[monthlyTrend.length - 1];
        const previousMonth = monthlyTrend[monthlyTrend.length - 2];
        const change = ((lastMonth.total - previousMonth.total) / previousMonth.total) * 100;

        if (change > 10) {
            insights += `- ⚠️ Your spending increased by ${Math.round(change)}% last month. Monitor closely to avoid overspending.\n`;
        } else if (change < -10) {
            insights += `- ✅ Great job! Your spending decreased by ${Math.abs(Math.round(change))}% last month.\n`;
        } else {
            insights += "- Your spending has been relatively stable. Maintain this consistency.\n";
        }
    }

    return insights;
}

function generateMockSavingTips(categoryTotals) {
    let tips = "## 💡 Personalized Saving Tips\n\n";
    tips += "1. **Meal Planning**: Prepare weekly meal plans to reduce impulsive food purchases\n";
    tips += "2. **Transportation**: Consider carpooling or public transport to cut travel costs\n";
    tips += "3. **Subscriptions**: Review and cancel unused subscriptions and memberships\n";
    tips += "4. **Shopping**: Use the 24-hour rule before making non-essential purchases\n";
    tips += "5. **Energy**: Reduce utility bills by being mindful of electricity and water usage\n";

    return tips;
}

function generateMockPrediction(monthlyTrend, currentMonthSpending) {
    let prediction = "## 🔮 Overspending Risk Prediction\n\n";
    prediction += "**Risk Level**: Medium\n\n";
    prediction += "**Analysis**:\n";
    prediction += "- Based on your recent spending patterns, maintain awareness of your budget limits\n";
    prediction += "- Current pace suggests you may approach budget limits in categories like Food and Shopping\n\n";
    prediction += "**Recommended Actions**:\n";
    prediction += "1. Set weekly spending limits for high-expense categories\n";
    prediction += "2. Review expenses mid-month to stay on track\n";
    prediction += "3. Build an emergency buffer of 10% in your budget\n";

    return prediction;
}

export default {
    generateSpendingInsights,
    generateSavingTips,
    predictOverspendingRisk
};
