import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET() {
  try {
    const headersList = headers()
    const token = headersList.get("Authorization")

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/crypto/watchlist`, {
      headers: {
        Authorization: token,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch watchlist" }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching watchlist:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

