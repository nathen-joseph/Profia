import { Link, useLocation } from "wouter";
import { Activity, BarChart2, Bookmark, Search, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { data: health, isError } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), refetchInterval: 30000 } });

  const navItems = [
    { href: "/", label: "Dashboard", icon: BarChart2 },
    { href: "/analyze", label: "Analyze", icon: Activity },
    { href: "/watchlist", label: "Watchlist", icon: Bookmark },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-r border-border bg-card flex flex-col">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight">StockSight AI</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon size={18} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 mt-auto border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isError || health?.status !== "ok" ? (
              <><WifiOff size={14} className="text-destructive" /> API Offline</>
            ) : (
              <><Wifi size={14} className="text-primary" /> API Connected</>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
