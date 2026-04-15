import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Product from '@/models/Product'
import Category from '@/models/Category'
import Supplier from '@/models/Supplier'
import Branch from '@/models/Branch'

/** Shared error response for any DB failure */
function dbError(detail?: string) {
  return NextResponse.json(
    {
      success: false,
      message: 'تعذر الاتصال بقاعدة البيانات. يرجى التأكد من تشغيل الخادم.',
      ...(detail ? { detail } : {}),
    },
    { status: 503 }
  )
}

/* ── GET /api/products ─────────────────────────────────────── */
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const isAdmin = request.cookies.has('almaz_auth')
    
    // Build query. Hide costPrice if not an admin.
    const query = Product.find({}).sort({ createdAt: -1 })
      .populate('categoryId')
      .populate('supplierId')
      .populate('branchId')
    if (!isAdmin) query.select('-costPrice')
    
    const products = await query.lean()
    return NextResponse.json({ success: true, products })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[GET /api/products]', msg)
    return dbError(msg)
  }
}

/* ── POST /api/products ────────────────────────────────────── */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()

    const { name, category, categoryId, price, stock, costPrice, condition, serialNumber, storage, color, batteryHealth, supplierId, isSerialized, branchId, ownershipType } = body
    if (!name || (!category && !categoryId) || price == null || stock == null) {
      return NextResponse.json(
        { success: false, message: 'الحقول المطلوبة: name, category/categoryId, price, stock' },
        { status: 400 }
      )
    }

    const product = await Product.create({
      name:     String(name).trim(),
      category: String(category).trim(),
      price:    Number(price),
      costPrice:costPrice != null ? Number(costPrice) : 0,
      stock:    Number(stock),
      categoryId: categoryId || undefined,
      condition: condition || 'New',
      specs:    body.specs    ? String(body.specs).trim()    : undefined,
      imageUrl: body.imageUrl ? String(body.imageUrl).trim() : undefined,
      badge:    body.badge    ? String(body.badge).trim()    : undefined,
      serialNumber: serialNumber ? String(serialNumber).trim() : undefined,
      storage:  storage ? String(storage).trim() : undefined,
      color:    color ? String(color).trim() : undefined,
      batteryHealth: batteryHealth ? String(batteryHealth).trim() : undefined,
      supplierId: supplierId ? supplierId : undefined,
      isSerialized: isSerialized !== undefined ? Boolean(isSerialized) : true,
      branchId: branchId ? branchId : undefined,
      ownershipType: ownershipType ? String(ownershipType) : 'Owned',
    })

    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[POST /api/products]', msg)
    return dbError(msg)
  }
}

/* ── DELETE /api/products?id=… ─────────────────────────────── */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'معرّف المنتج (id) مطلوب' },
        { status: 400 }
      )
    }

    await Product.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[DELETE /api/products]', msg)
    return dbError(msg)
  }
}

/* ── PUT /api/products ─────────────────────────────────────── */
export async function PUT(request: Request) {
  try {
    await connectDB()
    const body = await request.json()

    // Accept both _id and id from the client
    const { _id, id, ...updateData } = body
    const targetId = _id || id

    if (!targetId) {
      return NextResponse.json(
        { success: false, message: 'Missing product ID' },
        { status: 400 }
      )
    }

    // Debug: log exactly what Mongoose receives — visible in the Next.js terminal
    console.log('[PUT /api/products] targetId:', targetId)
    console.log('[PUT /api/products] updateData:', JSON.stringify(updateData, null, 2))

    const updatedProduct = await Product.findByIdAndUpdate(
      targetId,
      { $set: updateData },
      { returnDocument: 'after' }   // runValidators removed — partial $set fails required checks
    )

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: updatedProduct })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[PUT /api/products]', msg)
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}
