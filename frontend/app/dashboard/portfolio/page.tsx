"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Plus, Trash2, Briefcase, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PortfolioItem {
  asset_id: string
  purchase_price: number
  purchase_date: string
  quantity: number
  current_price: number
  profit_loss: number
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    asset_id: "",
    purchase_price: "",
    purchase_date: "",
    quantity: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchPortfolio()
  }, [])

  async function fetchPortfolio() {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await fetch("http://localhost:5001/api/crypto/portfolio", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch portfolio")
      }

      const data = await response.json()
      console.log("📦 Portfolio response:", data)
      if (Array.isArray(data)) {
        setPortfolio(data)
      } else if (Array.isArray(data.data)) {
        // Parse numbers safely
        const parsed = data.data.map((item: { purchase_price: string; quantity: string; current_price: string | null; profit_loss: string | null }) => ({
          ...item,
          purchase_price: parseFloat(item.purchase_price),
          quantity: parseFloat(item.quantity),
          current_price: item.current_price !== null ? parseFloat(item.current_price) : 0,
          profit_loss: item.profit_loss !== null ? parseFloat(item.profit_loss) : 0,
        }))
        setPortfolio(parsed)
      } else {
        console.error("❌ Unexpected portfolio response format:", data)
        setPortfolio([])
      }
    } catch (err) {
      console.error("Error fetching portfolio:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await fetch("http://localhost:5001/api/crypto/portfolio/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          asset_id: formData.asset_id.toUpperCase(),
          purchase_price: Number.parseFloat(formData.purchase_price),
          purchase_date: formData.purchase_date,
          quantity: Number.parseFloat(formData.quantity),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add investment")
      }

      toast({
        title: "Investment Added",
        description: `${formData.asset_id.toUpperCase()} has been added to your portfolio.`,
      })

      // Reset form and close dialog
      setFormData({
        asset_id: "",
        purchase_price: "",
        purchase_date: "",
        quantity: "",
      })
      setIsAddDialogOpen(false)

      // Refresh portfolio data
      fetchPortfolio()
    } catch (err) {
      console.error("Error adding investment:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add investment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveInvestment = async (assetId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await fetch("http://localhost:5001/api/crypto/portfolio/remove", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          asset_id: assetId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove investment")
      }

      toast({
        title: "Investment Removed",
        description: `${assetId} has been removed from your portfolio.`,
      })

      // Update local state
      setPortfolio((prev) => prev.filter((item) => item.asset_id !== assetId))
    } catch (err) {
      console.error("Error removing investment:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove investment",
        variant: "destructive",
      })
    }
  }

  // Calculate total portfolio value and allocation data for pie chart
  const totalValue = portfolio.reduce((sum, item) => sum + item.current_price * item.quantity, 0)
  const pieChartData = portfolio.map((item) => ({
    name: item.asset_id,
    value: item.current_price * item.quantity,
  }))

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d", "#ffc658", "#8dd1e1"]

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Portfolio</h2>
          <p className="text-muted-foreground">Manage your cryptocurrency investments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Investment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Investment</DialogTitle>
              <DialogDescription>Enter the details of your cryptocurrency investment.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddInvestment}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="asset_id">Cryptocurrency Symbol</Label>
                  <Input
                    id="asset_id"
                    name="asset_id"
                    placeholder="BTC"
                    value={formData.asset_id}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purchase_price">Purchase Price (USD)</Label>
                  <Input
                    id="purchase_price"
                    name="purchase_price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="30000.00"
                    value={formData.purchase_price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    name="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.000001"
                    min="0"
                    placeholder="0.5"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Investment"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="investments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Investments</CardTitle>
              <CardDescription>Track your cryptocurrency investments and their performance</CardDescription>
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
                      <Skeleton className="h-9 w-9 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : portfolio.length > 0 ? (
                <div className="space-y-2">
                  {portfolio.map((item) => (
                    <div key={item.asset_id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          {item.asset_id.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">{item.asset_id}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.quantity} units @ ${item.purchase_price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right mr-4">
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
                          })}{" "}
                          ({((item.profit_loss / (item.purchase_price * item.quantity)) * 100).toFixed(2)}%)
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        onClick={() => handleRemoveInvestment(item.asset_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Your portfolio is empty</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your cryptocurrency investments to track their performance
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Investment
                  </Button>
                </div>
              )}
            </CardContent>
            {portfolio.length > 0 && (
              <CardFooter className="border-t px-6 py-4">
                <div className="flex w-full justify-between">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Total Value</div>
                    <div className="text-xl font-bold">
                      ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-muted-foreground">Total Profit/Loss</div>
                    <div
                      className={`text-xl font-bold ${
                        portfolio.reduce((sum, item) => sum + item.profit_loss, 0) >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {portfolio.reduce((sum, item) => sum + item.profit_loss, 0) >= 0 ? "+" : ""}$
                      {Math.abs(portfolio.reduce((sum, item) => sum + item.profit_loss, 0)).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Allocation</CardTitle>
              <CardDescription>See how your investments are distributed</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Skeleton className="h-[300px] w-[300px] rounded-full" />
                </div>
              ) : portfolio.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  <div className="h-[300px] w-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => typeof value === 'number' ? `$${value.toFixed(2)}` : `$${value}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 w-full max-w-xs">
                    {pieChartData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span>{entry.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            $
                            {entry.value.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {((entry.value / totalValue) * 100).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Your portfolio is empty</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your cryptocurrency investments to see your allocation
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Investment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
              <CardDescription>Track how your portfolio has performed</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : portfolio.length > 0 ? (
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
                      <LineChart
                        data={[
                          { date: "2023-01", value: totalValue * 0.7 },
                          { date: "2023-02", value: totalValue * 0.75 },
                          { date: "2023-03", value: totalValue * 0.72 },
                          { date: "2023-04", value: totalValue * 0.8 },
                          { date: "2023-05", value: totalValue * 0.85 },
                          { date: "2023-06", value: totalValue * 0.9 },
                          { date: "2023-07", value: totalValue * 0.88 },
                          { date: "2023-08", value: totalValue * 0.92 },
                          { date: "2023-09", value: totalValue * 0.95 },
                          { date: "2023-10", value: totalValue * 0.97 },
                          { date: "2023-11", value: totalValue * 0.99 },
                          { date: "2023-12", value: totalValue },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Your portfolio is empty</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your cryptocurrency investments to track performance
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Investment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

