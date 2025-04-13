import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/crypto/top-cryptos`)

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch cryptocurrencies" }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching top cryptos:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

