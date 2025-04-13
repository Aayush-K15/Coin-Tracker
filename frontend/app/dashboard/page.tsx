"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Plus, TrendingUp, TrendingDown, Eye, Briefcase } from "lucide-react"
import Link from "next/link"

interface Crypto {
  asset_id: string
  name: string
  price_usd: number
  volume_1day_usd?: number
  percent_change_24h: number
}

export default function DashboardPage() {
  const [watchlist, setWatchlist] = useState<Crypto[]>([])
  const [portfolio, setPortfolio] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("Authentication token not found")
        }

        // Fetch watchlist
        const watchlistResponse = await fetch("http://localhost:5001/api/crypto/watchlist", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!watchlistResponse.ok) {
          throw new Error("Failed to fetch watchlist")
        }

        const watchlistData = await watchlistResponse.json()

        // Add mock percent change data for UI purposes
        const enhancedWatchlist = watchlistData.data.map((crypto: Crypto) => ({
          ...crypto,
          percent_change_24h: crypto.percent_change_24h,
        }))

        setWatchlist(enhancedWatchlist)

        // Fetch portfolio
        const portfolioResponse = await fetch("http://localhost:5001/api/crypto/portfolio", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!portfolioResponse.ok) {
          throw new Error("Failed to fetch portfolio")
        }

        const portfolioData = await portfolioResponse.json()
        setPortfolio(portfolioData)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Mock data for the overview chart
  const overviewData = [
    { name: "Jan", value: 4000 },
    { name: "Feb", value: 3000 },
    { name: "Mar", value: 5000 },
    { name: "Apr", value: 4500 },
    { name: "May", value: 6000 },
    { name: "Jun", value: 5500 },
    { name: "Jul", value: 7000 },
    { name: "Aug", value: 8000 },
    { name: "Sep", value: 9000 },
    { name: "Oct", value: 10000 },
    { name: "Nov", value: 9500 },
    { name: "Dec", value: 11000 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your crypto assets.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/market">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add to Watchlist
            </Button>
          </Link>
          <Link href="/dashboard/portfolio">
            <Button variant="outline">
              <Briefcase className="mr-2 h-4 w-4" />
              Manage Portfolio
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$12,345.67</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Watchlist Assets</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "-" : watchlist.length}</div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Loading..." : `${watchlist.length} cryptocurrencies tracked`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-[120px]" />
                ) : watchlist.length > 0 ? (
                  <>
                    <div className="text-2xl font-bold">
                      {watchlist.sort((a, b) => (b.percent_change_24h || 0) - (a.percent_change_24h || 0))[0]?.asset_id}
                    </div>
                    <p className="text-xs text-green-500">
                      +
                      {Math.abs(
                        watchlist.sort((a, b) => (b.percent_change_24h || 0) - (a.percent_change_24h || 0))[0]
                          ?.percent_change_24h || 0,
                      ).toFixed(2)}
                      % (24h)
                    </p>
                  </>
                ) : (
                  <div className="text-sm">No data available</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Worst Performer</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-[120px]" />
                ) : watchlist.length > 0 ? (
                  <>
                    <div className="text-2xl font-bold">
                      {watchlist.sort((a, b) => (a.percent_change_24h || 0) - (b.percent_change_24h || 0))[0]?.asset_id}
                    </div>
                    <p className="text-xs text-red-500">
                      {(
                        watchlist.sort((a, b) => (a.percent_change_24h || 0) - (b.percent_change_24h || 0))[0]
                          ?.percent_change_24h || 0
                      ).toFixed(2)}
                      % (24h)
                    </p>
                  </>
                ) : (
                  <div className="text-sm">No data available</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio Overview</CardTitle>
              <CardDescription>Your portfolio value over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ChartContainer
                  config={{
                    value: {
                      label: "Portfolio Value",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overviewData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Watchlist</CardTitle>
              <CardDescription>Track your favorite cryptocurrencies</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-[100px]" />
                          <Skeleton className="h-3 w-[60px]" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-3 w-[60px] ml-auto mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : watchlist.length > 0 ? (
                <div className="space-y-2">
                  {watchlist.map((crypto) => (
                    <Link
                      key={crypto.asset_id}
                      href={`/dashboard/crypto/${crypto.asset_id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          {crypto.asset_id.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">{crypto.name}</div>
                          <div className="text-sm text-muted-foreground">{crypto.asset_id}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          $
                          {crypto.price_usd?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "N/A"}
                        </div>
                        <div
                          className={`text-sm ${(crypto.percent_change_24h || 0) >= 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {(crypto.percent_change_24h || 0) >= 0 ? "+" : ""}
                          {(crypto.percent_change_24h || 0).toFixed(2)}%
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Your watchlist is empty</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add cryptocurrencies to your watchlist to track their prices
                  </p>
                  <Link href="/dashboard/market">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Cryptocurrencies
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Portfolio</CardTitle>
              <CardDescription>Track your cryptocurrency investments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-[100px]" />
                          <Skeleton className="h-3 w-[60px]" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-3 w-[60px] ml-auto mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : portfolio.length > 0 ? (
                <div className="space-y-2">
                  {portfolio.map((item) => (
                    <Link
                      key={item.asset_id}
                      href={`/dashboard/crypto/${item.asset_id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          {item.asset_id.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">{item.asset_id}</div>
                          <div className="text-sm text-muted-foreground">{item.quantity} units</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          $
                          {(item.current_price * item.quantity).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className={`text-sm ${item.profit_loss >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {item.profit_loss >= 0 ? "+" : ""}$
                          {Math.abs(item.profit_loss).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Your portfolio is empty</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add cryptocurrencies to your portfolio to track your investments
                  </p>
                  <Link href="/dashboard/portfolio">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Investments
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
