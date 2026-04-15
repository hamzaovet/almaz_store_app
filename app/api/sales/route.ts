import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Sale from '@/models/Sale'
import Product from '@/models/Product'
import Transaction from '@/models/Transaction'
import Supplier from '@/models/Supplier'
import Category from '@/models/Category'
import Branch from '@/models/Branch'
import { StoreSettings } from '@/models/StoreSettings'

/* ── Shared error ────────────────────────────────────────────── */
function fail(msg: string, status = 400) {
  return NextResponse.json({ success: false, message: msg }, { status })
}

/* ── GET /api/sales ──────────────────────────────────────────── */
export async function GET() {
  try {
    await connectDB()
    const sales = await Sale.find({}).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ success: true, sales })
  } catch (err: any) {
    console.error('[GET /api/sales]', err.message)
    return fail(err.message, 500)
  }
}

/* ── POST /api/sales ─────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    const {
      customer,
      phone,
      date,
      paymentMethod,
      customerId,
      // items: Array<{ productId, qty, actualUnitPrice, fulfillmentLocation? }>
      items,
    } = body

    /* ── Validation ─────────────────────────────────────────── */
    if (!customer?.trim())   return fail('اسم العميل مطلوب')
    if (!paymentMethod)      return fail('طريقة الدفع مطلوبة')
    if (!items || !Array.isArray(items) || items.length === 0) {
      return fail('يجب إضافة منتج واحد على الأقل في السلة')
    }

    const VALID_METHODS = ['Cash', 'Visa', 'Valu', 'InstaPay', 'Vodafone Cash']
    if (!VALID_METHODS.includes(paymentMethod)) {
      return fail('طريقة دفع غير صالحة')
    }

    /* ── Resolve & validate products ────────────────────────── */
    const saleItems: any[] = []
    let totalListPrice = 0
    let totalSalePrice = 0
    let totalCost      = 0

    // Consignment payables to collect: supplierId → amount owed
    const consignmentPayables: Map<string, number> = new Map()

    for (const item of items) {
      const {
        productId,
        qty = 1,
        actualUnitPrice,
        fulfillmentLocation, // optional override from cart UI
      } = item

      if (!productId) return fail('productId مطلوب لكل عنصر')

      const product = await Product.findById(productId)
      if (!product) return fail(`المنتج ${productId} غير موجود`, 404)

      const qtyNum     = Number(qty)
      const unitPrice  = product.price
      const actualUnit = Number(actualUnitPrice ?? unitPrice)
      const costAtSale = product.costPrice ?? 0

      // ── Serialized device check (isSerialized OR has serialNumber) ──
      const isSerial = product.isSerialized || Boolean(product.serialNumber)

      if (isSerial) {
        if (qtyNum !== 1) return fail(`الجهاز ${product.name} مسلسل — الكمية يجب أن تكون 1`)
        if (product.stock <= 0) return fail(`الجهاز ${product.name} غير متوفر في المخزون`)
      } else {
        if (product.stock < qtyNum) {
          return fail(`المخزون غير كافٍ للمنتج ${product.name} — متاح: ${product.stock}`)
        }
      }

      totalListPrice += unitPrice  * qtyNum
      totalSalePrice += actualUnit * qtyNum
      totalCost      += costAtSale * qtyNum

      // ── Consignment: track cost owed to supplier ─────────────
      if (product.ownershipType === 'Consignment' && product.supplierId) {
        const suppId = String(product.supplierId)
        const currentOwed = consignmentPayables.get(suppId) ?? 0
        consignmentPayables.set(suppId, currentOwed + costAtSale * qtyNum)
      }

      // Resolve branch name for fulfillment location display
      let resolvedLocation = fulfillmentLocation ?? 'Main Store'
      if (!fulfillmentLocation && product.branchId) {
        const br = await Branch.findById(product.branchId).lean() as any
        if (br?.name) resolvedLocation = br.name
      }

      saleItems.push({
        productId,
        productName:         product.name,
        serialNumber:        product.serialNumber ?? undefined,
        qty:                 qtyNum,
        unitPrice,
        actualUnitPrice:     actualUnit,
        costAtSale,
        fulfillmentLocation: resolvedLocation,
        ownershipType:       product.ownershipType ?? 'Owned',
      })

      /* ── A: Deduct stock ──────────────────────────────────── */
      if (isSerial) {
        product.stock = 0   // zeroed — serialized sold
      } else {
        product.stock = Math.max(0, product.stock - qtyNum)
      }
      await product.save()
    }

    const discount = totalListPrice - totalSalePrice
    const profit   = totalSalePrice - totalCost

    /* ── B: Create Sale record with sequential invoice ──────── */
    const settings = await StoreSettings.findOneAndUpdate(
      {},
      { $inc: { nextInvoiceNumber: 1 } },
      { upsert: true, new: true }
    )
    const currentInvoiceNum = settings.nextInvoiceNumber - 1
    const invoiceNumber = String(currentInvoiceNum).padStart(4, '0')

    const sale = await Sale.create({
      customer: customer.trim(),
      phone:    phone?.trim() ?? '',
      date:     date ?? new Date().toISOString().split('T')[0],
      invoiceNumber,
      items:    saleItems,
      totalListPrice,
      totalSalePrice,
      totalCost,
      profit,
      discount,
      paymentMethod,
      customerId: customerId || undefined,
    })

    /* ── C: Auto-create IN Transaction in Treasury ──────────── */
    await Transaction.create({
      amount:        totalSalePrice,
      type:          'IN',
      paymentMethod,
      description:   `إيراد بيع — ${customer.trim()} — ${saleItems.map(i => i.productName).join('، ')}`,
      referenceId:   sale._id,
      date:          new Date(),
    })

    /* ── D: Consignment — credit supplier ledgers ───────────── */
    // For each consignment item's supplier, INCREASE their balance
    // (positive balance = store owes them), reflecting cost owed.
    for (const [supplierId, amountOwed] of consignmentPayables.entries()) {
      await Supplier.findByIdAndUpdate(
        supplierId,
        { $inc: { balance: amountOwed } },   // positive = مستحق علينا
        { new: true }
      )
      // Also log an outgoing liability in Transaction for full audit trail
      await Transaction.create({
        amount:        amountOwed,
        type:          'OUT',
        paymentMethod: 'Cash',   // placeholder type — actual settlement happens separately
        description:   `مستحق أمانة للمورد — فاتورة #${invoiceNumber} — ${saleItems.filter(i => i.ownershipType === 'Consignment').map(i => i.productName).join('، ')}`,
        referenceId:   sale._id,
        date:          new Date(),
      })
    }

    return NextResponse.json({ success: true, sale }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/sales]', err.message)
    return fail(err.message, 500)
  }
}
