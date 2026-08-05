/**
 * Market Sync & AI Logic
 * Handles real-time price fluctuations and trend predictions.
 */

const MarketSync = {
    // Simulated Scraper Configuration
    sources: [
        { name: "Baghdad Exchange", type: "usd_rate" },
        { name: "Basra Steel Hub", type: "material" },
        { name: "Construction Materials FB", type: "material" }
    ],

    /**
     * Fetch the latest market indices
     * In a real app, this would use fetch() or a scraper microservice
     */
    async fetchMarketUpdates() {
        console.log("Sycing with market indices...");

        // Simulating a small random fluctuation based on USD rate
        // Iraqi market often ties construction materials to USD
        const usdFluctuation = (Math.random() * 20) - 10; // -10 to +10 IQD
        constructionData.market.usd_iqd += Math.round(usdFluctuation);

        // Update status based on USD trend
        if (usdFluctuation > 5) constructionData.market.status = "rising";
        else if (usdFluctuation < -5) constructionData.market.status = "falling";
        else constructionData.market.status = "stable";

        constructionData.market.last_sync = new Date().toISOString();

        return constructionData.market;
    },

    /**
     * AI Prediction Engine
     * Analyzes historical data to provide advice
     */
    getAIAdvice() {
        const advice = [];

        // 1. Steel Analysis
        const steelTrend = this.calculateTrend(constructionData.historical.steel);
        if (steelTrend > 0.05) {
            advice.push({
                item: "steel",
                danger: true,
                msg: "نلاحظ ارتفاعاً مستمراً في أسعار الحديد. ننصح بالشراء الآن قبل زيادة متوقعة الأسبوع القادم."
            });
        } else if (steelTrend < -0.05) {
            advice.push({
                item: "steel",
                danger: false,
                msg: "أسعار الحديد في نزول. قد ترغب بالانتظار قليلاً إذا لم يكن البناء مستعجلاً."
            });
        }

        // 2. Exchange Rate Analysis
        if (constructionData.market.usd_iqd > 1550) {
            advice.push({
                item: "currency",
                danger: true,
                msg: "سعر الصرف مرتفع حالياً، مما يؤثر على المواد المستوردة. يرجى توخي الحذر في التسعير."
            });
        }

        return advice;
    },

    /**
     * Simple Linear Trend Calculation
     * Returns % change between average of last 2 vs first 2
     */
    calculateTrend(data) {
        if (!data || data.length < 4) return 0;
        const firstAvg = (data[0] + data[1]) / 2;
        const lastAvg = (data[data.length - 1] + data[data.length - 2]) / 2;
        return (lastAvg - firstAvg) / firstAvg;
    },

    /**
     * Apply Market Modifier to Base Price
     * This links the exchange rate index to the final material price
     */
    getLivePrice(basePrice, itemKey) {
        // Simple heuristic: For every 10 IQD change in USD above 1450, 
        // add 0.5% to material cost (imported materials)
        const usdBase = 1450;
        const currentUsd = constructionData.market.usd_iqd;

        if (currentUsd <= usdBase) return basePrice;

        const multiplier = 1 + (((currentUsd - usdBase) / 10) * 0.005);
        return Math.round(basePrice * multiplier);
    }
};

// Auto-run sync every 30 seconds (simulated)
setInterval(() => {
    MarketSync.fetchMarketUpdates().then(update => {
        // Dispatch event for UI updates if needed
        const event = new CustomEvent('marketUpdate', { detail: update });
        window.dispatchEvent(event);
    });
}, 30000);
