import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { lat, lng } = await req.json()

  const response = await fetch('https://api.mireye.com/v1/fetch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MIREYE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      lat,
      lng,
      preset: 'flood_risk'
    })
  })

  const data = await response.json()
  return NextResponse.json(data)
}