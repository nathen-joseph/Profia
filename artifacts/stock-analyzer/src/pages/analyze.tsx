import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAnalyzeStock, useAddToWatchlist, getGetWatchlistQueryKey, useGetWatchlist } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Gauge } from "@/components/ui/gauge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { BookmarkPlus, Loader2, ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle, Activity } from "lucide-react";

export default function Analyze() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialTicker = searchParams.get("ticker") || "";

  const [ticker, setTicker] = useState(initialTicker);
  const [investmentAmount, setInvestmentAmount] = useState<string>("1000");
  const [timeHorizon, setTimeHorizon] = useState<string>("1 year");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const analyzeMutation = useAnalyzeStock();
  const addToWatchlistMutation = useAddToWatchlist();

  // Load automatically if ticker in URL
  useEffect(() => {
    if (initialTicker && !analyzeMutation.data && !analyzeMutation.isPending) {
      handleAnalyze(initialTicker);
    }
  }, [initialTicker]);

  const handleAnalyze = (tickerToAnalyze: string = ticker) => {
    if (!tickerToAnalyze) return;
    
    analyzeMutation.mutate({
      data: {
        ticker: tickerToAnalyze,
        investmentAmount: investmentAmount ? Number(investmentAmount) : null,
        timeHorizon: timeHorizon || null
      }
    }, {
      onError: (err) => {
        toast({
          title: "Analysis Failed",
          description: err.error || "An unexpected error occurred.",
          variant: "destructive"
        });
      }
    });
  };

  const handleAddToWatchlist = () => {
    if (!analyzeMutation.data) return;
    
    addToWatchlistMutation.mutate({
      data: {
        ticker: analyzeMutation.data.ticker,
        companyName: analyzeMutation.data.companyName
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
        toast({
          title: "Added to Watchlist",
          description: `${analyzeMutation.data.ticker} has been saved.`
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Could not add to watchlist.",
          variant: "destructive"
        });
      }
    });
  };

  const result = analyzeMutation.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock Analysis</h1>
        <p className="text-muted-foreground mt-1">Deep dive into company fundamentals and AI-driven projections.</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }}
            className="flex flex-col md:flex-row gap-4 items-end"
          >
            <div className="space-y-2 w-full md:w-auto flex-1">
              <Label htmlFor="ticker">Ticker Symbol</Label>
              <Input 
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="e.g. MSFT" 
                className="font-mono uppercase"
                data-testid="input-analyze-ticker"
                required
              />
            </div>
            <div className="space-y-2 w-full md:w-48">
              <Label htmlFor="amount">Investment ($)</Label>
              <Input 
                id="amount"
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                placeholder="1000" 
              />
            </div>
            <div className="space-y-2 w-full md:w-48">
              <Label htmlFor="horizon">Time Horizon</Label>
              <Select value={timeHorizon} onValueChange={setTimeHorizon}>
                <SelectTrigger>
                  <SelectValue placeholder="Select horizon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 month">1 Month</SelectItem>
                  <SelectItem value="6 months">6 Months</SelectItem>
                  <SelectItem value="1 year">1 Year</SelectItem>
                  <SelectItem value="5 years">5 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              className="w-full md:w-auto" 
              disabled={analyzeMutation.isPending || !ticker}
              data-testid="button-analyze"
            >
              {analyzeMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
              ) : (
                "Run Analysis"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {analyzeMutation.isPending && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-6"
          >
            <div className="relative">
              <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <Activity className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold animate-pulse text-foreground">Processing Market Data...</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">Evaluating sentiment, historical performance, and macroeconomic indicators. This usually takes 5-10 seconds.</p>
            </div>
          </motion.div>
        )}

        {result && !analyzeMutation.isPending && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-4xl font-black tracking-tight flex items-center gap-3">
                  {result.ticker} 
                  <Badge 
                    className={
                      result.recommendation === "Buy" ? "bg-primary text-primary-foreground text-sm py-1 px-3" : 
                      result.recommendation === "Sell" ? "bg-destructive text-destructive-foreground text-sm py-1 px-3" : 
                      "bg-muted text-muted-foreground text-sm py-1 px-3"
                    }
                  >
                    {result.recommendation}
                  </Badge>
                </h2>
                <p className="text-xl text-muted-foreground mt-1">{result.companyName}</p>
              </div>
              <Button variant="outline" onClick={handleAddToWatchlist} disabled={addToWatchlistMutation.isPending}>
                <BookmarkPlus className="mr-2 h-4 w-4" /> Save to Watchlist
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="flex flex-col items-center justify-center p-6 bg-card border-border">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Probability of Profit</h3>
                <Gauge value={result.successRatePercent} size={180} strokeWidth={12} />
              </Card>

              <Card className="md:col-span-2 border-border flex flex-col justify-center">
                <CardHeader>
                  <CardTitle className="text-lg">Risk & Sentiment</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Risk Level</div>
                    <div className="text-2xl font-bold flex items-center gap-2 capitalize">
                      {result.riskLevel === "high" || result.riskLevel === "very_high" ? (
                        <AlertTriangle className="text-destructive" size={24} />
                      ) : (
                        <TrendingUp className="text-primary" size={24} />
                      )}
                      <span className={result.riskLevel.includes('high') ? 'text-destructive' : 'text-primary'}>
                        {result.riskLevel.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Market Sentiment</div>
                    <div className="text-2xl font-bold capitalize flex items-center gap-2">
                      <span className={
                        result.sentiment === 'bullish' ? 'text-primary' : 
                        result.sentiment === 'bearish' ? 'text-destructive' : 
                        'text-muted-foreground'
                      }>
                        {result.sentiment}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <ArrowUpRight /> Bullish Scenario
                  </CardTitle>
                  <CardDescription>{result.profitScenario.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-primary mb-4">+{result.profitScenario.percentChange}%</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.profitScenario.description}</p>
                </CardContent>
              </Card>

              <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <ArrowDownRight /> Bearish Scenario
                  </CardTitle>
                  <CardDescription>{result.lossScenario.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-destructive mb-4">{result.lossScenario.percentChange}%</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.lossScenario.description}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>AI Summary & Key Factors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-foreground leading-relaxed text-lg">{result.summary}</p>
                
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Key Drivers</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.keyFactors.map((factor, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm bg-accent text-accent-foreground border border-border">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
