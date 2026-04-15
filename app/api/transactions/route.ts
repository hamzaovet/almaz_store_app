import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Transaction from '@/models/Transaction'

function dbError(detail?: string) {
  return NextResponse.json(
    { success: false, message: 'Database error', ...(detail ? { detail } : {}) },
    { status: 503 }
  )
}

/* ── GET /api/transactions — paginated feed ─────────────────── */
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? 50)
    const transactions = await Transaction.find({})
      .sort({ date: -1 })
      .limit(limit)
      .lean()
    return NextResponse.json({ success: true, transactions })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return dbError(msg)
  }
}

/* ── POST /api/transactions — log a new transaction ─────────── */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()

    const { amount, type, paymentMethod, description, referenceId, date } = body

    if (!amount || !type || !paymentMethod) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: amount, type, paymentMethod' },
        { status: 400 }
      )
    }

    const validTypes   = ['IN', 'OUT']
    const validMethods = ['Cash', 'Visa', 'Valu', 'InstaPay', 'Vodafone Cash']

    if (!validTypes.includes(type)) {
      return NextResponse.json({ success: false, message: 'Invalid type. Must be IN or OUT' }, { status: 400 })
    }
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json({ success: false, message: 'Invalid paymentMethod' }, { status: 400 })
    }

    const transaction = await Transaction.create({
      amount:        Number(amount),
      type:          String(type),
      paymentMethod: String(paymentMethod),
      description:   description ? String(description).trim() : undefined,
      referenceId:   referenceId ? referenceId : undefined,
      date:          date ? new Date(date) : new Date(),
    })

    return NextResponse.json({ success: true, transaction }, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return dbError(msg)
  }
}

/* ── DELETE /api/transactions?id=… ─────────────────────────── */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 })
    await Transaction.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return dbError(msg)
  }
}
