import { NextResponse } from 'next/server'
import { connectDB as dbConnect } from '@/lib/db'
import Sale from '@/models/Sale'
import Product from '@/models/Product'

export async function GET() {
  try {
    await dbConnect()
    const sales = await Sale.find({}).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ success: true, sales })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect()
    const body = await req.json()
    
    // Fetch product to get cost
    const product = await Product.findById(body.productId)
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })
    }

    // Calculate financials
    const costAtSale = product.costPrice || 0
    const actualSalePrice = body.actualSalePrice || product.price
    const discount = product.price - actualSalePrice

    // Create Sale
    const sale = await Sale.create({
      ...body,
      productName: product.name,
      price: product.price,
      costAtSale,
      actualSalePrice,
      discount
    })

    // Decrease Inventory
    product.stock -= (body.qty || 1)
    await product.save()

    return NextResponse.json({ success: true, sale }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
