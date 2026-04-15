import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Transaction from '@/models/Transaction'

const PAYMENT_METHODS = ['Cash', 'Visa', 'Valu', 'InstaPay', 'Vodafone Cash'] as const
type PaymentMethod = typeof PAYMENT_METHODS[number]

function dbError(detail?: string) {
  return NextResponse.json(
    { success: false, message: 'Database error', ...(detail ? { detail } : {}) },
    { status: 503 }
  )
}

/* ── GET /api/treasury — aggregate balances per payment method ── */
export async function GET() {
  try {
    await connectDB()

    const pipeline = await Transaction.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          totalIn:  { $sum: { $cond: [{ $eq: ['$type', 'IN']  }, '$amount', 0] } },
          totalOut: { $sum: { $cond: [{ $eq: ['$type', 'OUT'] }, '$amount', 0] } },
          txCount:  { $sum: 1 },
        },
      },
    ])

    // Build a map from aggregation results
    const balanceMap: Record<string, { totalIn: number; totalOut: number; balance: number; txCount: number }> = {}
    for (const row of pipeline) {
      balanceMap[row._id] = {
        totalIn:  row.totalIn,
        totalOut: row.totalOut,
        balance:  row.totalIn - row.totalOut,
        txCount:  row.txCount,
      }
    }

    // Ensure all methods are always present (even if zero)
    const channels = PAYMENT_METHODS.map((method) => ({
      method,
      totalIn:  balanceMap[method]?.totalIn  ?? 0,
      totalOut: balanceMap[method]?.totalOut ?? 0,
      balance:  balanceMap[method]?.balance  ?? 0,
      txCount:  balanceMap[method]?.txCount  ?? 0,
    }))

    const grandTotal = channels.reduce((acc, c) => acc + c.balance, 0)
    const grandIn    = channels.reduce((acc, c) => acc + c.totalIn,  0)
    const grandOut   = channels.reduce((acc, c) => acc + c.totalOut, 0)

    return NextResponse.json({ success: true, channels, grandTotal, grandIn, grandOut })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return dbError(msg)
  }
}
