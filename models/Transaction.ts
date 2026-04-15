import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ITransaction extends Document {
  referenceId?: mongoose.Types.ObjectId | any // Polymorphic reference
  amount: number
  type: 'IN' | 'OUT'
  paymentMethod: 'Cash' | 'Visa' | 'Valu' | 'InstaPay' | 'Vodafone Cash'
  description?: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

const TransactionSchema = new Schema<ITransaction>(
  {
    referenceId:   { type: Schema.Types.ObjectId, required: false },
    amount:        { type: Number, required: true },
    type:          { type: String, enum: ['IN', 'OUT'], required: true },
    paymentMethod: { type: String, enum: ['Cash', 'Visa', 'Valu', 'InstaPay', 'Vodafone Cash'], required: true },
    description:   { type: String, required: false, trim: true },
    date:          { type: Date, default: Date.now, required: true },
  },
  {
    timestamps: true,
  }
)

const Transaction: Model<ITransaction> =
  (mongoose.models.Transaction as Model<ITransaction>) ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema)

export default Transaction
