import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { StoreSettings } from '@/models/StoreSettings'

export async function GET() {
  try {
    await connectDB()
    const settings = await StoreSettings.findOne()
    if (!settings) {
      // Return temporary fallback as requested
      return NextResponse.json({ whatsappNumber: '201129592916' })
    }
    return NextResponse.json({ whatsappNumber: settings.whatsappNumber })
  } catch (error) {
    console.error('[API Settings] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve settings', whatsappNumber: '201129592916' },
      { status: 500 }
    )
  }
}
