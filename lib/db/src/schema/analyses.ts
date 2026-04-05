import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  ticker: text("ticker").notNull(),
  companyName: text("company_name").notNull(),
  successRatePercent: numeric("success_rate_percent", { precision: 5, scale: 2 }).notNull(),
  riskLevel: text("risk_level").notNull(),
  sentiment: text("sentiment").notNull(),
  profitScenarioLabel: text("profit_scenario_label").notNull(),
  profitScenarioPercent: numeric("profit_scenario_percent", { precision: 7, scale: 2 }).notNull(),
  profitScenarioDesc: text("profit_scenario_desc").notNull(),
  lossScenarioLabel: text("loss_scenario_label").notNull(),
  lossScenarioPercent: numeric("loss_scenario_percent", { precision: 7, scale: 2 }).notNull(),
  lossScenarioDesc: text("loss_scenario_desc").notNull(),
  summary: text("summary").notNull(),
  keyFactors: text("key_factors").array().notNull().default([]),
  recommendation: text("recommendation").notNull(),
  investmentAmount: numeric("investment_amount", { precision: 15, scale: 2 }),
  timeHorizon: text("time_horizon"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ id: true, createdAt: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
