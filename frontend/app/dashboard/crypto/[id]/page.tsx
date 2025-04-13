"use client"

import { useState, useEffect } from "react"
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
  price_usd: number
  volume_1day_usd?: number
  percent_change_24h?: number
  market_cap_usd?: number
  inWatchlist?: boolean
}

export default function CryptoDetailPage({ params }: CryptoDetailProps) {
  const { id } = params
  const [crypto, setCrypto] = useState<CryptoData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inWatchlist, setInWatchlist] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchCryptoData() {
      setIsLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("Authentication token not found")
        }

        // In a real app, you would fetch the specific crypto data
        // For now, we'll simulate it with the top cryptos endpoint
        const cryptosResponse = await fetch("http://localhost:5001/api/crypto/top-cryptos")
        if (!cryptosResponse.ok) {
          throw new Error("Failed to fetch cryptocurrency data")
        }

        const cryptosData = await cryptosResponse.json()
        const cryptoData = cryptosData.find((c: CryptoData) => c.asset_id === id.toUpperCase())

        if (!cryptoData) {
          throw new Error("Cryptocurrency not found")
        }

        // Add mock data for UI purposes
        cryptoData.percent_change_24h = Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1)
        cryptoData.market_cap_usd = cryptoData.price_usd * (Math.random() * 1000000000 + 100000000)

        setCrypto(cryptoData)

        // Check if crypto is in watchlist
        const watchlistResponse = await fetch("http://localhost:5001/api/crypto/watchlist", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!watchlistResponse.ok) {
          throw new Error("Failed to fetch watchlist")
        }

        const watchlistData = await watchlistResponse.json()
        const isInWatchlist = watchlistData.some((c: CryptoData) => c.asset_id === id.toUpperCase())
        setInWatchlist(isInWatchlist)
      } catch (err) {
        console.error("Error fetching crypto data:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCryptoData()
  }, [id])

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

  // Generate mock historical price data
  const generateHistoricalData = (days: number, volatility: number) => {
    if (!crypto) return []

    const data = []
    const basePrice = crypto.price_usd
    const now = new Date()

    for (let i = days; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)

      // Random walk with trend
      const trend = (crypto.percent_change_24h || 0) > 0 ? 1 : -1
      const randomFactor = Math.random() * volatility * trend
      const dayFactor = 1 + (((days - i) / days) * (crypto.percent_change_24h || 0)) / 100

      data.push({
        date: date.toISOString().split("T")[0],
        price: basePrice * dayFactor * (1 + randomFactor),
      })
    }

    return data
  }

  const priceData1D = generateHistoricalData(1, 0.01)
  const priceData1W = generateHistoricalData(7, 0.02)
  const priceData1M = generateHistoricalData(30, 0.03)
  const priceData1Y = generateHistoricalData(365, 0.05)

  return (
    <div className="space-y-6">
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
                ${crypto?.price_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Change</CardTitle>
            {isLoading ? (
              <Skeleton className="h-4 w-4" />
            ) : (crypto?.percent_change_24h || 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div
                className={`text-2xl font-bold ${(crypto?.percent_change_24h || 0) >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {(crypto?.percent_change_24h || 0) >= 0 ? "+" : ""}
                {(crypto?.percent_change_24h || 0).toFixed(2)}%
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
                ${(crypto?.market_cap_usd || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                ${(crypto?.volume_1day_usd || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
          <CardDescription>Historical price data for {crypto?.name || id.toUpperCase()}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="1M" className="space-y-4">
            <div className="flex justify-between">
              <TabsList>
                <TabsTrigger value="1D">1D</TabsTrigger>
                <TabsTrigger value="1W">1W</TabsTrigger>
                <TabsTrigger value="1M">1M</TabsTrigger>
                <TabsTrigger value="1Y">1Y</TabsTrigger>
              </TabsList>
              <div className="text-sm font-medium">
                {isLoading ? (
                  <Skeleton className="h-5 w-28" />
                ) : (
                  <div className={`${(crypto?.percent_change_24h || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {(crypto?.percent_change_24h || 0) >= 0 ? "+" : ""}
                    {(crypto?.percent_change_24h || 0).toFixed(2)}% (24h)
                  </div>
                )}
              </div>
            </div>

            <TabsContent value="1D" className="h-[350px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ChartContainer
                  config={{
                    price: {
                      label: "Price",
                      color:
                        (crypto?.percent_change_24h || 0) >= 0
                          ? "hsl(142.1, 76.2%, 36.3%)"
                          : "hsl(346.8, 77.2%, 49.8%)",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceData1D}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={
                              (crypto?.percent_change_24h || 0) >= 0
                                ? "hsl(142.1, 76.2%, 36.3%)"
                                : "hsl(346.8, 77.2%, 49.8%)"
                            }
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor={
                              (crypto?.percent_change_24h || 0) >= 0
                                ? "hsl(142.1, 76.2%, 36.3%)"
                                : "hsl(346.8, 77.2%, 49.8%)"
                            }
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis
                        domain={["auto", "auto"]}
                        tickFormatter={(value) =>
                          `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        }
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="var(--color-price)"
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </TabsContent>

            <TabsContent value="1W" className="h-[350px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ChartContainer
                  config={{
                    price: {
                      label: "Price",
                      color:
                        (crypto?.percent_change_24h || 0) >= 0
                          ? "hsl(142.1, 76.2%, 36.3%)"
                          : "hsl(346.8, 77.2%, 49.8%)",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceData1W}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={
                              (crypto?.percent_change_24h || 0) >= 0
                                ? "hsl(142.1, 76.2%, 36.3%)"
                                : "hsl(346.8, 77.2%, 49.8%)"
                            }
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor={
                              (crypto?.percent_change_24h || 0) >= 0
                                ? "hsl(142.1, 76.2%, 36.3%)"
                                : "hsl(346.8, 77.2%, 49.8%)"
                            }
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis
                        domain={["auto", "auto"]}
                        tickFormatter={(value) =>
                          `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        }
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="var(--color-price)"
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </TabsContent>

            <TabsContent value="1M" className="h-[350px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ChartContainer
                  config={{
                    price: {
                      label: "Price",
                      color:
                        (crypto?.percent_change_24h || 0) >= 0
                          ? "hsl(142.1, 76.2%, 36.3%)"
                          : "hsl(346.8, 77.2%, 49.8%)",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceData1M}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={
                              (crypto?.percent_change_24h || 0) >= 0
                                ? "hsl(142.1, 76.2%, 36.3%)"
                                : "hsl(346.8, 77.2%, 49.8%)"
                            }
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor={
                              (crypto?.percent_change_24h || 0) >= 0
                                ? "hsl(142.1, 76.2%, 36.3%)"
                                : "hsl(346.8, 77.2%, 49.8%)"
                            }
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis
                        domain={["auto", "auto"]}
                        tickFormatter={(value) =>
                          `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        }
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="var(--color-price)"
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </TabsContent>

            <TabsContent value="1Y" className="h-[350px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ChartContainer
                  config={{
                    price: {
                      label: "Price",
                      color:
                        (crypto?.percent_change_24h || 0) >= 0
                          ? "hsl(142.1, 76.2%, 36.3%)"
                          : "hsl(346.8, 77.2%, 49.8%)",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceData1Y}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={
                              (crypto?.percent_change_24h || 0) >= 0
                                ? "hsl(142.1, 76.2%, 36.3%)"
                                : "hsl(346.8, 77.2%, 49.8%)"
                            }
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor={
                              (crypto?.percent_change_24h || 0) >= 0
                                ? "hsl(142.1, 76.2%, 36.3%)"
                                : "hsl(346.8, 77.2%, 49.8%)"
                            }
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis
                        domain={["auto", "auto"]}
                        tickFormatter={(value) =>
                          `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        }
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="var(--color-price)"
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
                {crypto?.price_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                with a market capitalization of $
                {(crypto?.market_cap_usd || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium">Key Statistics</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Market Cap</span>
                      <span>
                        ${(crypto?.market_cap_usd || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">24h Volume</span>
                      <span>
                        ${(crypto?.volume_1day_usd || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">24h Change</span>
                      <span className={`${(crypto?.percent_change_24h || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {(crypto?.percent_change_24h || 0) >= 0 ? "+" : ""}
                        {(crypto?.percent_change_24h || 0).toFixed(2)}%
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
                        {((crypto?.price_usd ?? 0) * 1.5).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">All-Time Low</span>
                      <span>
                        $
                        {((crypto?.price_usd ?? 0) * 0.3).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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

