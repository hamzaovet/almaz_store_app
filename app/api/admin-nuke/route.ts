import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Sale from '@/models/Sale'
import Expense from '@/models/Expense'
import Transaction from '@/models/Transaction'
import Product from '@/models/Product'
import Category from '@/models/Category'
import Supplier from '@/models/Supplier'
import Branch from '@/models/Branch'
import { User } from '@/models/User'
import { StoreSettings } from '@/models/StoreSettings'

export async function GET() {
  try {
    await connectDB()

    // ── 1. Wipe Transactional Data ────────────────────────────
    await Sale.deleteMany({})
    await Expense.deleteMany({})
    await Transaction.deleteMany({})

    // ── 2. Wipe Inventory & Relationships ──────────────────────
    await Product.deleteMany({})
    await Category.deleteMany({})
    await Supplier.deleteMany({})
    await Branch.deleteMany({})

    // ── 3. Wipe Users except protected ones ───────────────────
    await User.deleteMany({
      username: { $nin: ['dr_hamza', 'admin_almaz'] }
    })

    // ── 4. Reset Invoice Counter ──────────────────────────────
    await StoreSettings.findOneAndUpdate(
      {},
      { nextInvoiceNumber: 1 },
      { upsert: true, new: true }
    )

    console.log('✅ System Cleaned. Invoice #0001 Ready.')

    return NextResponse.json({
      success: true,
      message: 'System Cleaned. Invoice #0001 Ready. Transactional and inventory data purged.'
    })

  } catch (error: any) {
    console.error('[Admin Nuke] Error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
