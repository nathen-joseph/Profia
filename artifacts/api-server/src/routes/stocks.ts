import { Router, type IRouter } from "express";
import { desc, sql } from "drizzle-orm";
import { db, analysesTable } from "@workspace/db";
import {
  AnalyzeStockBody,
  AnalyzeStockResponse,
  SearchStocksQueryParams,
  GetRecentAnalysesResponse,
  GetAnalysisStatsResponse,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const POPULAR_STOCKS = [
  { ticker: "AAPL", name: "Apple Inc.", sector: "Technology", description: "Consumer electronics, software, and services giant" },
  { ticker: "TSLA", name: "Tesla Inc.", sector: "Automotive / EV", description: "Electric vehicles, energy storage, and solar" },
  { ticker: "NVDA", name: "NVIDIA Corporation", sector: "Semiconductors", description: "GPUs for AI, gaming, and data centers" },
  { ticker: "MSFT", name: "Microsoft Corporation", sector: "Technology", description: "Cloud computing, software, and AI services" },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology", description: "Search, advertising, cloud, and AI" },
  { ticker: "AMZN", name: "Amazon.com Inc.", sector: "E-Commerce / Cloud", description: "E-commerce, AWS, and digital streaming" },
  { ticker: "META", name: "Meta Platforms Inc.", sector: "Social Media", description: "Social networking, VR/AR, and digital advertising" },
  { ticker: "NFLX", name: "Netflix Inc.", sector: "Streaming", description: "Global streaming entertainment platform" },
];

const STOCK_SEARCH_DB: Array<{ ticker: string; name: string; sector: string }> = [
  { ticker: "AAPL", name: "Apple Inc.", sector: "Technology" },
  { ticker: "TSLA", name: "Tesla Inc.", sector: "Automotive / EV" },
  { ticker: "NVDA", name: "NVIDIA Corporation", sector: "Semiconductors" },
  { ticker: "MSFT", name: "Microsoft Corporation", sector: "Technology" },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology" },
  { ticker: "AMZN", name: "Amazon.com Inc.", sector: "E-Commerce / Cloud" },
  { ticker: "META", name: "Meta Platforms Inc.", sector: "Social Media" },
  { ticker: "NFLX", name: "Netflix Inc.", sector: "Streaming" },
  { ticker: "AMD", name: "Advanced Micro Devices", sector: "Semiconductors" },
  { ticker: "INTC", name: "Intel Corporation", sector: "Semiconductors" },
  { ticker: "BABA", name: "Alibaba Group", sector: "E-Commerce / Cloud" },
  { ticker: "DIS", name: "Walt Disney Company", sector: "Entertainment" },
  { ticker: "JPM", name: "JPMorgan Chase", sector: "Financial Services" },
  { ticker: "V", name: "Visa Inc.", sector: "Financial Services" },
  { ticker: "MA", name: "Mastercard Inc.", sector: "Financial Services" },
  { ticker: "BAC", name: "Bank of America", sector: "Financial Services" },
  { ticker: "WMT", name: "Walmart Inc.", sector: "Retail" },
  { ticker: "PG", name: "Procter & Gamble", sector: "Consumer Goods" },
  { ticker: "JNJ", name: "Johnson & Johnson", sector: "Healthcare" },
  { ticker: "PFE", name: "Pfizer Inc.", sector: "Pharmaceuticals" },
  { ticker: "MRNA", name: "Moderna Inc.", sector: "Biotechnology" },
  { ticker: "COIN", name: "Coinbase Global", sector: "Cryptocurrency" },
  { ticker: "PLTR", name: "Palantir Technologies", sector: "AI / Data Analytics" },
  { ticker: "RBLX", name: "Roblox Corporation", sector: "Gaming / Metaverse" },
  { ticker: "SPOT", name: "Spotify Technology", sector: "Music Streaming" },
  { ticker: "UBER", name: "Uber Technologies", sector: "Ride-Sharing" },
  { ticker: "LYFT", name: "Lyft Inc.", sector: "Ride-Sharing" },
  { ticker: "SQ", name: "Block Inc.", sector: "FinTech" },
  { ticker: "PYPL", name: "PayPal Holdings", sector: "FinTech" },
  { ticker: "SHOP", name: "Shopify Inc.", sector: "E-Commerce" },
];

router.get("/stocks/search", async (req, res): Promise<void> => {
  const parsed = SearchStocksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const q = parsed.data.q.toLowerCase();
  const results = STOCK_SEARCH_DB.filter(
    (s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  ).slice(0, 10);

  res.json(results);
});

router.get("/stocks/popular", async (_req, res): Promise<void> => {
  res.json(POPULAR_STOCKS);
});

router.post("/stocks/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeStockBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ error: parsed.error.message }, "Invalid analyze request");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { ticker, investmentAmount, timeHorizon } = parsed.data;
  const tickerUpper = ticker.toUpperCase().trim();

  const knownCompany = STOCK_SEARCH_DB.find((s) => s.ticker === tickerUpper);
  const companyContext = knownCompany ? knownCompany.name : tickerUpper;

  const investmentContext = investmentAmount
    ? `The user plans to invest $${investmentAmount} USD.`
    : "";
  const horizonContext = timeHorizon
    ? `Their investment time horizon is: ${timeHorizon}.`
    : "No specific time horizon was provided — analyze for a general medium-term perspective.";

  const systemPrompt = `You are an expert stock market analyst with deep knowledge of fundamental analysis, technical analysis, market sentiment, macroeconomic trends, and risk assessment. You provide insightful, balanced investment analysis.

You MUST respond with a valid JSON object ONLY — no markdown, no code blocks, no extra text.`;

  const userPrompt = `Analyze the stock ${tickerUpper} (${companyContext}) as an investment opportunity.
${investmentContext}
${horizonContext}

Respond with a JSON object in exactly this format:
{
  "companyName": "Full Company Name",
  "successRatePercent": <number 0-100, estimated probability of profitable outcome>,
  "riskLevel": <"low" | "moderate" | "high" | "very_high">,
  "sentiment": <"bullish" | "bearish" | "neutral">,
  "profitScenario": {
    "label": "Bull Case",
    "percentChange": <positive number, e.g. 25.5>,
    "description": "2-3 sentences describing the optimistic scenario"
  },
  "lossScenario": {
    "label": "Bear Case",
    "percentChange": <negative number, e.g. -18.5>,
    "description": "2-3 sentences describing the pessimistic scenario"
  },
  "summary": "A detailed 3-5 paragraph analysis covering the company's current position, competitive moat, growth drivers, risks, and market dynamics. Be specific and insightful.",
  "keyFactors": ["Factor 1", "Factor 2", "Factor 3", "Factor 4", "Factor 5"],
  "recommendation": <"Buy" | "Hold" | "Sell">
}

Be realistic, nuanced, and data-driven. Consider current market conditions as of early 2025.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const rawContent = completion.choices[0]?.message?.content ?? "{}";

  let analysisData: {
    companyName: string;
    successRatePercent: number;
    riskLevel: string;
    sentiment: string;
    profitScenario: { label: string; percentChange: number; description: string };
    lossScenario: { label: string; percentChange: number; description: string };
    summary: string;
    keyFactors: string[];
    recommendation: string;
  };

  analysisData = JSON.parse(rawContent);

  const [inserted] = await db
    .insert(analysesTable)
    .values({
      ticker: tickerUpper,
      companyName: analysisData.companyName,
      successRatePercent: String(analysisData.successRatePercent),
      riskLevel: analysisData.riskLevel,
      sentiment: analysisData.sentiment,
      profitScenarioLabel: analysisData.profitScenario.label,
      profitScenarioPercent: String(analysisData.profitScenario.percentChange),
      profitScenarioDesc: analysisData.profitScenario.description,
      lossScenarioLabel: analysisData.lossScenario.label,
      lossScenarioPercent: String(analysisData.lossScenario.percentChange),
      lossScenarioDesc: analysisData.lossScenario.description,
      summary: analysisData.summary,
      keyFactors: analysisData.keyFactors,
      recommendation: analysisData.recommendation,
      investmentAmount: investmentAmount != null ? String(investmentAmount) : null,
      timeHorizon: timeHorizon ?? null,
    })
    .returning();

  const response = {
    id: inserted.id,
    ticker: inserted.ticker,
    companyName: inserted.companyName,
    successRatePercent: Number(inserted.successRatePercent),
    riskLevel: inserted.riskLevel,
    sentiment: inserted.sentiment,
    profitScenario: {
      label: inserted.profitScenarioLabel,
      percentChange: Number(inserted.profitScenarioPercent),
      description: inserted.profitScenarioDesc,
    },
    lossScenario: {
      label: inserted.lossScenarioLabel,
      percentChange: Number(inserted.lossScenarioPercent),
      description: inserted.lossScenarioDesc,
    },
    summary: inserted.summary,
    keyFactors: inserted.keyFactors,
    recommendation: inserted.recommendation,
    createdAt: inserted.createdAt.toISOString(),
  };

  res.json(AnalyzeStockResponse.parse(response));
});

router.get("/analyses/recent", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(analysesTable)
    .orderBy(desc(analysesTable.createdAt))
    .limit(20);

  const result = rows.map((r) => ({
    id: r.id,
    ticker: r.ticker,
    companyName: r.companyName,
    successRatePercent: Number(r.successRatePercent),
    riskLevel: r.riskLevel,
    sentiment: r.sentiment,
    recommendation: r.recommendation,
    createdAt: r.createdAt.toISOString(),
  }));

  res.json(GetRecentAnalysesResponse.parse(result));
});

router.get("/analyses/stats", async (_req, res): Promise<void> => {
  const rows = await db.select().from(analysesTable);

  const totalAnalyses = rows.length;
  const avgSuccessRate =
    totalAnalyses > 0
      ? rows.reduce((sum, r) => sum + Number(r.successRatePercent), 0) / totalAnalyses
      : 0;

  const bullishCount = rows.filter((r) => r.sentiment === "bullish").length;
  const bearishCount = rows.filter((r) => r.sentiment === "bearish").length;
  const neutralCount = rows.filter((r) => r.sentiment === "neutral").length;

  const tickerCounts: Record<string, number> = {};
  for (const r of rows) {
    tickerCounts[r.ticker] = (tickerCounts[r.ticker] ?? 0) + 1;
  }
  const mostAnalyzedTicker =
    totalAnalyses > 0
      ? Object.entries(tickerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
      : null;

  res.json(
    GetAnalysisStatsResponse.parse({
      totalAnalyses,
      avgSuccessRate: Math.round(avgSuccessRate * 10) / 10,
      bullishCount,
      bearishCount,
      neutralCount,
      mostAnalyzedTicker,
    })
  );
});

export default router;
