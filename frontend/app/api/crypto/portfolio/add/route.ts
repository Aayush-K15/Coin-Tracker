import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function POST(request: Request) {
  try {
    const headersList = headers()
    const token = (await headersList).get("Authorization")

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch(`http://localhost:5001/crypto/portfolio/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error adding to portfolio:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

