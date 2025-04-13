"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, EyeOff, Search, Info } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Crypto {
  asset_id: string
  name: string
  price_usd: number
  volume_1day_usd?: number
  percent_change_24h?: number
  inWatchlist?: boolean
}

export default function MarketPage() {
  const [cryptos, setCryptos] = useState<Crypto[]>([])
  const [filteredCryptos, setFilteredCryptos] = useState<Crypto[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [watchlist, setWatchlist] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("Authentication token not found")
        }

        // Fetch top cryptos
        const cryptosResponse = await fetch("http://localhost:5001/api/crypto/top-cryptos")
        if (!cryptosResponse.ok) {
          throw new Error("Failed to fetch cryptocurrencies")
        }
        const cryptosData = await cryptosResponse.json()

        // Add mock percent change data for UI purposes
        const enhancedCryptos = cryptosData.data.map((crypto: Crypto) => ({
          ...crypto,
          percent_change_24h: Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1),
        }))

        // Fetch user's watchlist
        const watchlistResponse = await fetch("http://localhost:5001/api/crypto/watchlist", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!watchlistResponse.ok) {
          throw new Error("Failed to fetch watchlist")
        }

        const watchlistData = await watchlistResponse.json()
        const watchlistIds = watchlistData.data.map((crypto: Crypto) => crypto.asset_id)
        setWatchlist(watchlistIds)

        // Mark cryptos that are in the watchlist
        const cryptosWithWatchlist = enhancedCryptos.map((crypto: Crypto) => ({
          ...crypto,
          inWatchlist: watchlistIds.includes(crypto.asset_id),
        }))

        setCryptos(cryptosWithWatchlist)
        setFilteredCryptos(cryptosWithWatchlist)
      } catch (err) {
        console.error("Error fetching market data:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCryptos(cryptos)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = cryptos.filter(
        (crypto) => crypto.name.toLowerCase().includes(query) || crypto.asset_id.toLowerCase().includes(query),
      )
      setFilteredCryptos(filtered)
    }
  }, [searchQuery, cryptos])

  const handleAddToWatchlist = async (cryptoId: string) => {
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
          asset_id: cryptoId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add to watchlist")
      }

      // Update local state
      setWatchlist((prev) => [...prev, cryptoId])
      setCryptos((prev) =>
        prev.map((crypto) => (crypto.asset_id === cryptoId ? { ...crypto, inWatchlist: true } : crypto)),
      )
      setFilteredCryptos((prev) =>
        prev.map((crypto) => (crypto.asset_id === cryptoId ? { ...crypto, inWatchlist: true } : crypto)),
      )

      toast({
        title: "Added to Watchlist",
        description: `${cryptoId} has been added to your watchlist.`,
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

  const handleRemoveFromWatchlist = async (cryptoId: string) => {
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
          asset_id: cryptoId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove from watchlist")
      }

      // Update local state
      setWatchlist((prev) => prev.filter((id) => id !== cryptoId))
      setCryptos((prev) =>
        prev.map((crypto) => (crypto.asset_id === cryptoId ? { ...crypto, inWatchlist: false } : crypto)),
      )
      setFilteredCryptos((prev) =>
        prev.map((crypto) => (crypto.asset_id === cryptoId ? { ...crypto, inWatchlist: false } : crypto)),
      )

      toast({
        title: "Removed from Watchlist",
        description: `${cryptoId} has been removed from your watchlist.`,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Market</h2>
          <p className="text-muted-foreground">Browse and track cryptocurrencies</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cryptocurrencies..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cryptocurrency Market</CardTitle>
          <CardDescription>View the latest prices and add to your watchlist</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
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
          ) : filteredCryptos.length > 0 ? (
            <div className="space-y-2">
              {filteredCryptos.map((crypto) => (
                <div key={crypto.asset_id} className="flex items-center justify-between rounded-lg border p-3">
                  <Link
                    href={`/dashboard/crypto/${crypto.asset_id}`}
                    className="flex items-center gap-3 flex-1 hover:underline"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      {crypto.asset_id.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium">{crypto.name}</div>
                      <div className="text-sm text-muted-foreground">{crypto.asset_id}</div>
                    </div>
                  </Link>
                  <div className="text-right mr-4">
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
                  {crypto.inWatchlist ? (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveFromWatchlist(crypto.asset_id)}
                      title="Remove from watchlist"
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleAddToWatchlist(crypto.asset_id)}
                      title="Add to watchlist"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Info className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No cryptocurrencies found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search query</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

