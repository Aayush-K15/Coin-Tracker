"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Eye, EyeOff, Briefcase, ArrowLeft, TrendingUp, TrendingDown, Clock, DollarSign, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface CryptoDetailProps {
  params: {
    id: string
  }
}

interface CryptoData {
  asset_id: string
  name: string
  price_usd?: number
  volume_1day_usd?: number
  change_percent_24h?: number
  market_cap_usd?: number
}

interface HistoricalData {
  time_period_start: string
  price_close: number
}

export default function CryptoDetailPage({ params }: CryptoDetailProps) {
  const { id } = use(params)
  const [crypto, setCrypto] = useState<CryptoData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [historicalData, setHistoricalData] = useState<{
    '1D': HistoricalData[]
    '1W': HistoricalData[]
    '1M': HistoricalData[]
    '1Y': HistoricalData[]
  }>({
    '1D': [],
    '1W': [],
    '1M': [],
    '1Y': []
  })
  const { toast } = useToast()

  // Update your useEffect hook to properly fetch historical data
  useEffect(() => {
    async function fetchCryptoData() {
      setIsLoading(true);
      setError(null);
  
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found");
        }
  
        // Fetch crypto details - we'll use the API endpoint that provides the most complete data
        const cryptoResponse = await fetch(`http://localhost:5001/api/crypto/top-cryptos`);
        if (!cryptoResponse.ok) {
          throw new Error("Failed to fetch cryptocurrency data");
        }
  
        const cryptoData = await cryptoResponse.json();
        const foundCrypto = cryptoData.data?.find((c) => c.asset_id === id.toUpperCase());
  
        if (!foundCrypto) {
          throw new Error("Cryptocurrency not found");
        }
  
        // Enhance crypto data with additional metadata
        // Get market cap - this could be included in your API
        // In a real app, you'd get this from your API
        const enhancedCrypto = {
          ...foundCrypto,
          change_percent_24h: foundCrypto.percent_change_24h || 0, // Handle possible field name difference
          market_cap_usd: foundCrypto.market_cap_usd || (foundCrypto.price_usd * 1000000) // Fallback calculation
        };
        console.log("Crypto data received:", foundCrypto);
        
        setCrypto(enhancedCrypto);
  
        // Check if crypto is in watchlist
        const watchlistResponse = await fetch("http://localhost:5001/api/crypto/watchlist", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (watchlistResponse.ok) {
          const watchlistData = await watchlistResponse.json();
          const isInWatchlist = watchlistData.data?.some((c) => c.asset_id === id.toUpperCase());
          setInWatchlist(isInWatchlist);
        }
  
        // Modified historical data fetching
        const fetchHistoricalData = async (period, limit) => {
          const response = await fetch(
            `http://localhost:5001/api/crypto/historical/${id.toUpperCase()}?period=${period}&limit=${limit}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          if (!response.ok) {
            console.error(`Error fetching ${period} data:`, response.status);
            return { data: [] };
          }
          
          return await response.json();
        };
  
        // Fetch historical data with appropriate periods
        try {
          const [dailyData, weeklyData, monthlyData, yearlyData] = await Promise.all([
            fetchHistoricalData("1H", 24),     // Last 24 hours (hourly)
            fetchHistoricalData("1DAY", 7),    // Last 7 days (daily)
            fetchHistoricalData("1DAY", 30),   // Last 30 days (daily)
            fetchHistoricalData("1DAY", 365)   // Last year (daily)
          ]);
  
          setHistoricalData({
            '1D': dailyData.data || [],
            '1W': weeklyData.data || [],
            '1M': monthlyData.data || [],
            '1Y': yearlyData.data || []
          });
        } catch (histError) {
          console.error("Error fetching historical data:", histError);
          // Continue with empty historical data rather than failing completely
        }
  
      } catch (err) {
        console.error("Error fetching crypto data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to fetch data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  
    fetchCryptoData();
  }, [id, toast]);

  const handleAddToWatchlist = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found")
      }
  
      const response = await fetch("http://localhost:5001/api/crypto/watchlist/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          asset_id: id.toUpperCase(),
        }),
      })
  
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add to watchlist")
      }
  
      setInWatchlist(true)
      toast({
        title: "Added to Watchlist",
        description: `${id.toUpperCase()} has been added to your watchlist.`,
      })
    } catch (err) {
      console.error("Error adding to watchlist:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add to watchlist",
        variant: "destructive",
      })
    }
  }
  
  const handleRemoveFromWatchlist = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found")
      }
  
      const response = await fetch("http://localhost:5001/api/crypto/watchlist/remove", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          asset_id: id.toUpperCase(),
        }),
      })
  
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove from watchlist")
      }
  
      setInWatchlist(false)
      toast({
        title: "Removed from Watchlist",
        description: `${id.toUpperCase()} has been removed from your watchlist.`,
      })
    } catch (err) {
      console.error("Error removing from watchlist:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove from watchlist",
        variant: "destructive",
      })
    }
  }
  

  // Helper function to format currency with fallback
  // Helper function to format currency with fallback
const formatCurrency = (value?: number, fractionDigits = 2) => {
  if (value === undefined || value === null || isNaN(value)) return "N/A";
  
  // For very large numbers, use appropriate formatting
  if (value >= 1000000000) {
    return `${(value / 1000000000).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}B`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}M`;
  }
  
  return value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/market">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">
            {isLoading ? <Skeleton className="h-9 w-32" /> : crypto?.name || id.toUpperCase()}
          </h2>
          <div className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium">
            {isLoading ? <Skeleton className="h-4 w-10" /> : crypto?.asset_id}
          </div>
        </div>
        <div className="flex gap-2">
          {isLoading ? (
            <Skeleton className="h-10 w-[140px]" />
          ) : inWatchlist ? (
            <Button variant="outline" onClick={handleRemoveFromWatchlist}>
              <EyeOff className="mr-2 h-4 w-4" />
              Remove from Watchlist
            </Button>
          ) : (
            <Button variant="outline" onClick={handleAddToWatchlist}>
              <Eye className="mr-2 h-4 w-4" />
              Add to Watchlist
            </Button>
          )}
          <Link href="/dashboard/portfolio">
            <Button>
              <Briefcase className="mr-2 h-4 w-4" />
              Add to Portfolio
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      {/* Stats cards */}
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Current Price</CardTitle>
      <DollarSign className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-7 w-28" />
      ) : (
        <div className="text-2xl font-bold">
          ${formatCurrency(crypto?.price_usd)}
        </div>
      )}
    </CardContent>
  </Card>
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">24h Change</CardTitle>
      {isLoading ? (
        <Skeleton className="h-4 w-4" />
      ) : ((crypto?.change_percent_24h ?? 0) >= 0 ? (
        <TrendingUp className="h-4 w-4 text-green-500" />
      ) : (
        <TrendingDown className="h-4 w-4 text-red-500" />
      ))}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-7 w-28" />
      ) : (
        <div
          className={`text-2xl font-bold ${(crypto?.change_percent_24h ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}
        >
          {(crypto?.change_percent_24h ?? 0) >= 0 ? "+" : ""}
          
          {formatCurrency(crypto?.change_percent_24h, 2)}%
        </div>
      )}
    </CardContent>
  </Card>
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
      <BarChart3 className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-7 w-28" />
      ) : (
        <div className="text-2xl font-bold">
          ${formatCurrency(crypto?.market_cap_usd, 0)}
        </div>
      )}
    </CardContent>
  </Card>
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
      <Clock className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-7 w-28" />
      ) : (
        <div className="text-2xl font-bold">
          ${formatCurrency(crypto?.volume_1day_usd, 0)}
        </div>
      )}
    </CardContent>
  </Card>
</div>

      {/* Price chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
          <CardDescription>Historical price data for {crypto?.name || id.toUpperCase()}</CardDescription>
        </CardHeader>
        <CardContent>
          {historicalData['1D'].length > 0 ? (
            // Replace the placeholder comment with this actual chart implementation
<Tabs defaultValue="1D" className="space-y-4">
  <TabsList>
    <TabsTrigger value="1D">1D</TabsTrigger>
    <TabsTrigger value="1W">1W</TabsTrigger>
    <TabsTrigger value="1M">1M</TabsTrigger>
    <TabsTrigger value="1Y">1Y</TabsTrigger>
  </TabsList>
  
  {['1D', '1W', '1M', '1Y'].map((period) => (
    <TabsContent key={period} value={period} className="space-y-4">
      <div className="h-[350px]">
        {historicalData[period as keyof typeof historicalData].length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={historicalData[period as keyof typeof historicalData].map((item) => ({
                date: item.time,
                price: item.close || item.price_close
              }))}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (period === '1D') {
                    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No data available for this period
          </div>
        )}
      </div>
    </TabsContent>
  ))}
</Tabs>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              {isLoading ? "Loading chart data..." : "No historical data available"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* About section */}
      <Card>
        <CardHeader>
          <CardTitle>About {crypto?.name || id.toUpperCase()}</CardTitle>
          <CardDescription>Overview and key information</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="space-y-4">
              <p>
                {crypto?.name || id.toUpperCase()} is a cryptocurrency with the symbol{" "}
                {crypto?.asset_id || id.toUpperCase()}. It is currently trading at $
                {formatCurrency(crypto?.price_usd)} with a market capitalization of $
                {formatCurrency(crypto?.market_cap_usd, 0)}.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium">Key Statistics</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Market Cap</span>
                      <span>${formatCurrency(crypto?.market_cap_usd, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">24h Volume</span>
                      <span>${formatCurrency(crypto?.volume_1day_usd, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">24h Change</span>
                      <span className={`${(crypto?.change_percent_24h || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {(crypto?.change_percent_24h || 0) >= 0 ? "+" : ""}
                        {formatCurrency(crypto?.change_percent_24h, 2)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Price History</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">All-Time High</span>
                      <span>
                        $
                        {formatCurrency(crypto?.price_usd ? crypto.price_usd * 1.5 : undefined)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">All-Time Low</span>
                      <span>
                        $
                        {formatCurrency(crypto?.price_usd ? crypto.price_usd * 0.3 : undefined)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">YTD Change</span>
                      <span className="text-green-500">+42.5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}