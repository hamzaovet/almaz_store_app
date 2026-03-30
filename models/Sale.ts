import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface ISale extends Document {
  customer:    string
  phone:       string
  date:        string
  productId?:  Types.ObjectId
  productName: string
  price:       number
  actualSalePrice: number
  costAtSale:  number
  discount:    number
  qty:         number
  total:       number
  createdAt:   Date
  updatedAt:   Date
}

const SaleSchema = new Schema<ISale>(
  {
    customer:    { type: String, required: true, trim: true },
    phone:       { type: String, required: true, trim: true },
    date:        { type: String, required: true },
    productId:   { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true, trim: true },
    price:       { type: Number, required: true, min: 0 },
    actualSalePrice: { type: Number, required: true, min: 0 },
    costAtSale:  { type: Number, required: true, min: 0 },
    discount:    { type: Number, default: 0 },
    qty:         { type: Number, required: true, default: 1, min: 1 },
    total:       { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
)

// Virtual: auto-compute discount & total before save
SaleSchema.pre('validate', function () {
  if (this.price && this.actualSalePrice) {
    this.discount = this.price - this.actualSalePrice
  }
  if (this.actualSalePrice && this.qty) {
    this.total = this.actualSalePrice * this.qty
  }
})

const Sale: Model<ISale> =
  (mongoose.models.Sale as Model<ISale>) ||
  mongoose.model<ISale>('Sale', SaleSchema)

export default Sale
