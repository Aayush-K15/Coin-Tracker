import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function DELETE(request: Request) {
  try {
    const headersList = headers()
    const token = headersList.get("Authorization")

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/crypto/portfolio/remove`, {
      method: "DELETE",
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
    console.error("Error removing from portfolio:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

