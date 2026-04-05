import { useGetWatchlist, getGetWatchlistQueryKey, useRemoveFromWatchlist } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Activity, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Watchlist() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: watchlist, isLoading } = useGetWatchlist({ query: { queryKey: getGetWatchlistQueryKey() } });
  const removeMutation = useRemoveFromWatchlist();

  const handleRemove = (id: number, ticker: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
        toast({ title: "Removed from Watchlist", description: `${ticker} has been removed.` });
      }
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Watchlist</h1>
        <p className="text-muted-foreground mt-1">Tracked stocks and quick access to AI analysis.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : watchlist?.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-xl border-border bg-card/50">
          <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">Watchlist is empty</h3>
          <p className="text-muted-foreground mb-6">You haven't saved any stocks yet.</p>
          <Button onClick={() => setLocation("/analyze")}>Analyze a Stock</Button>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {watchlist?.map((item) => (
            <motion.div key={item.id} variants={itemVariants}>
              <Card 
                className="hover:border-primary/50 transition-colors group cursor-pointer h-full flex flex-col relative overflow-hidden"
                onClick={() => setLocation(`/analyze?ticker=${item.ticker}`)}
                data-testid={`watchlist-item-${item.ticker}`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => handleRemove(item.id, item.ticker, e)}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl font-black font-mono tracking-tight">{item.ticker}</CardTitle>
                  <p className="text-sm text-muted-foreground truncate pr-8">{item.companyName}</p>
                </CardHeader>
                <CardContent className="mt-auto pt-4 flex justify-between items-center text-sm">
                  <span className="text-muted-foreground text-xs">
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Analyze <ExternalLink size={14} className="ml-1" />
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
