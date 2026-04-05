import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, watchlistTable } from "@workspace/db";
import {
  AddToWatchlistBody,
  RemoveFromWatchlistParams,
  GetWatchlistResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/watchlist", async (_req, res): Promise<void> => {
  const items = await db
    .select()
    .from(watchlistTable)
    .orderBy(desc(watchlistTable.addedAt));

  const result = items.map((i) => ({
    id: i.id,
    ticker: i.ticker,
    companyName: i.companyName,
    addedAt: i.addedAt.toISOString(),
  }));

  res.json(GetWatchlistResponse.parse(result));
});

router.post("/watchlist", async (req, res): Promise<void> => {
  const parsed = AddToWatchlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db
    .insert(watchlistTable)
    .values({
      ticker: parsed.data.ticker.toUpperCase().trim(),
      companyName: parsed.data.companyName,
    })
    .returning();

  res.status(201).json({
    id: item.id,
    ticker: item.ticker,
    companyName: item.companyName,
    addedAt: item.addedAt.toISOString(),
  });
});

router.delete("/watchlist/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RemoveFromWatchlistParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(watchlistTable)
    .where(eq(watchlistTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Watchlist item not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
