import { Link } from "wouter";
import { 
  useGetAnalysisStats, getGetAnalysisStatsQueryKey, 
  useGetPopularStocks, getGetPopularStocksQueryKey, 
  useGetRecentAnalyses, getGetRecentAnalysesQueryKey,
  useSearchStocks, getSearchStocksQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, TrendingDown, Minus, Activity, ArrowRight, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: stats, isLoading: statsLoading } = useGetAnalysisStats({ query: { queryKey: getGetAnalysisStatsQueryKey() } });
  const { data: popularStocks, isLoading: popularLoading } = useGetPopularStocks({ query: { queryKey: getGetPopularStocksQueryKey() } });
  const { data: recentAnalyses, isLoading: recentLoading } = useGetRecentAnalyses({ query: { queryKey: getGetRecentAnalysesQueryKey() } });
  
  const { data: searchResults, isLoading: searchLoading } = useSearchStocks(
    { q: debouncedQuery }, 
    { query: { queryKey: getSearchStocksQueryKey({ q: debouncedQuery }), enabled: debouncedQuery.length > 0 } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/analyze?ticker=${encodeURIComponent(searchQuery.trim().toUpperCase())}`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-50">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Intelligence</h1>
          <p className="text-muted-foreground mt-1">AI-powered insights for smarter investing decisions.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <form onSubmit={handleSearch}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder="Search ticker (e.g. AAPL)" 
              className="pl-10 bg-card border-border uppercase font-mono"
              data-testid="input-search-ticker"
            />
          </form>

          <AnimatePresence>
            {isFocused && debouncedQuery && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden"
              >
                {searchLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto divide-y divide-border">
                    {searchResults.map((result) => (
                      <div 
                        key={result.ticker}
                        className="p-3 hover:bg-accent cursor-pointer flex justify-between items-center transition-colors"
                        onClick={() => setLocation(`/analyze?ticker=${result.ticker}`)}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold font-mono">{result.ticker}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                            <Building2 size={12} /> {result.name}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{result.sector}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">No results found for "{debouncedQuery}"</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-0">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : stats ? (
          <>
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Analyses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalAnalyses.toLocaleString()}</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stats.avgSuccessRate.toFixed(1)}%</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Market Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-primary"><TrendingUp size={16} className="mr-1"/> {stats.bullishCount}</div>
                    <div className="flex items-center text-muted-foreground"><Minus size={16} className="mr-1"/> {stats.neutralCount}</div>
                    <div className="flex items-center text-destructive"><TrendingDown size={16} className="mr-1"/> {stats.bearishCount}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Most Analyzed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.mostAnalyzedTicker || "N/A"}</div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Popular Stocks */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity size={20} className="text-primary" /> Popular Stocks to Analyze
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {popularLoading ? (
              Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
            ) : popularStocks?.map((stock) => (
              <Card key={stock.ticker} className="hover:border-primary/50 transition-colors group cursor-pointer" onClick={() => setLocation(`/analyze?ticker=${stock.ticker}`)} data-testid={`card-popular-${stock.ticker}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{stock.ticker}</CardTitle>
                      <CardDescription className="line-clamp-1">{stock.name}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-muted">{stock.sector}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{stock.description}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Analyze Now <ArrowRight size={16} className="ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Recent Analyses */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Recent Analyses
          </h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {recentLoading ? (
                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-none first:rounded-t-xl last:rounded-b-xl" />)
              ) : recentAnalyses?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No recent analyses.</div>
              ) : recentAnalyses?.map((analysis) => (
                <div key={analysis.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-between" onClick={() => setLocation(`/analyze?ticker=${analysis.ticker}`)}>
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      {analysis.ticker}
                      <Badge 
                        variant="secondary" 
                        className={
                          analysis.recommendation === "Buy" ? "bg-primary/20 text-primary hover:bg-primary/30" : 
                          analysis.recommendation === "Sell" ? "bg-destructive/20 text-destructive hover:bg-destructive/30" : 
                          "bg-muted text-muted-foreground"
                        }
                      >
                        {analysis.recommendation}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{analysis.companyName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm">{analysis.successRatePercent}%</div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
