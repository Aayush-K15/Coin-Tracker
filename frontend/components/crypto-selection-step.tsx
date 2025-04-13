"use client"

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"

interface Crypto {
  asset_id: string
  name: string
  price_usd: number
}

interface CryptoSelectionStepProps {
  onComplete: (selectedCryptos: string[]) => void
  isLoading: boolean
}

export function CryptoSelectionStep({ onComplete, isLoading }: CryptoSelectionStepProps) {
  const [cryptos, setCryptos] = useState<Crypto[]>([])
  const [selectedCryptos, setSelectedCryptos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTopCryptos() {
      try {
        const response = await fetch("http://localhost:5001/api/crypto/top-cryptos")
        if (!response.ok) {
          throw new Error("Failed to fetch cryptocurrencies")
        }
        const data = await response.json()
        // Handle the updated response format with success and data properties
        if (data.success && Array.isArray(data.data)) {
          setCryptos(data.data)
        } else {
          setCryptos(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error("Error fetching cryptos:", err)
        setError("Failed to load cryptocurrencies. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchTopCryptos()
  }, [])

  function handleCryptoToggle(cryptoId: string) {
    setSelectedCryptos((prev) => {
      if (prev.includes(cryptoId)) {
        return prev.filter((id) => id !== cryptoId)
      } else {
        return [...prev, cryptoId]
      }
    })
  }

  if (loading) {
    return (
      <CardContent className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading cryptocurrencies...</p>
      </CardContent>
    )
  }

  if (error) {
    return (
      <CardContent className="py-6">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </CardContent>
    )
  }

  return (
    <>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Select cryptocurrencies to add to your watchlist. You can modify this later.
        </div>

        <div className="space-y-3">
          {cryptos.map((crypto) => (
            <div key={crypto.asset_id} className="flex items-center space-x-2 rounded-md border p-3">
              <Checkbox
                id={crypto.asset_id}
                checked={selectedCryptos.includes(crypto.asset_id)}
                onCheckedChange={() => handleCryptoToggle(crypto.asset_id)}
              />
              <div className="flex flex-1 items-center justify-between">
                <label
                  htmlFor={crypto.asset_id}
                  className="flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {crypto.name} ({crypto.asset_id})
                </label>
                <span className="text-sm font-medium">
                  $
                  {crypto.price_usd?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || "N/A"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.history.back()}>
          Back
        </Button>
        <Button
  onClick={async () => {
    console.log("Selected cryptos before submitting:", selectedCryptos);
    if (selectedCryptos.length === 0) {
      console.log("No cryptos selected - proceeding with empty selection");
    }
    await onComplete(selectedCryptos);
  }}
  disabled={isLoading}
>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Creating Account...
    </>
  ) : (
    "Complete Registration"
  )}
</Button>
      </CardFooter>
    </>
  )
}