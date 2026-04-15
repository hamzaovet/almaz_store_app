import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface ISaleItem {
  productId: Types.ObjectId
  productName: string
  serialNumber?: string
  qty: number
  unitPrice: number       // listed price at time of sale
  actualUnitPrice: number // final negotiated price per unit
  costAtSale: number      // cost price at time of sale (for profit calc)
  fulfillmentLocation?: string
  ownershipType?: string
}

export interface ISale extends Document {
  // --- Customer ---
  customer: string
  phone?: string
  date: string
  invoiceNumber: string

  // --- Line items (cart) ---
  items: ISaleItem[]

  // --- Financials ---
  totalListPrice: number   // sum of (unitPrice * qty)
  totalSalePrice: number   // sum of (actualUnitPrice * qty) — actual revenue
  totalCost: number        // sum of (costAtSale * qty)
  profit: number           // totalSalePrice - totalCost
  discount: number         // totalListPrice - totalSalePrice

  // --- Payment ---
  paymentMethod: 'Cash' | 'Visa' | 'Valu' | 'InstaPay' | 'Vodafone Cash'

  // --- Optional customer link ---
  customerId?: Types.ObjectId

  createdAt: Date
  updatedAt: Date
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    productId:           { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName:         { type: String, required: true, trim: true },
    serialNumber:        { type: String, required: false, trim: true },
    qty:                 { type: Number, required: true, min: 1, default: 1 },
    unitPrice:           { type: Number, required: true, min: 0 },
    actualUnitPrice:     { type: Number, required: true, min: 0 },
    costAtSale:          { type: Number, required: true, min: 0, default: 0 },
    fulfillmentLocation: { type: String, required: false, trim: true, default: 'Main Store' },
    ownershipType:       { type: String, required: false, trim: true, default: 'Owned' },
  },
  { _id: false }
)

const SaleSchema = new Schema<ISale>(
  {
    customer:       { type: String, required: true, trim: true },
    phone:          { type: String, required: false, trim: true },
    date:           { type: String, required: true },
    invoiceNumber:  { type: String, required: true, unique: true },
    items:          { type: [SaleItemSchema], required: true },
    totalListPrice: { type: Number, required: true, min: 0 },
    totalSalePrice: { type: Number, required: true, min: 0 },
    totalCost:      { type: Number, required: true, min: 0 },
    profit:         { type: Number, required: true },
    discount:       { type: Number, required: true, default: 0 },
    paymentMethod:  { type: String, enum: ['Cash', 'Visa', 'Valu', 'InstaPay', 'Vodafone Cash'], required: true },
    customerId:     { type: Schema.Types.ObjectId, ref: 'Supplier', required: false },
  },
  { timestamps: true }
)

// Clear stale cached model in dev so schema changes take effect immediately
if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as any).Sale
}

const Sale: Model<ISale> =
  mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema)

export default Sale
