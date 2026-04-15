import mongoose from 'mongoose'

export interface IStoreSettings extends mongoose.Document {
  whatsappNumber: string
  nextInvoiceNumber: number
}

const storeSettingsSchema = new mongoose.Schema<IStoreSettings>(
  {
    whatsappNumber: { type: String, required: true, default: '201129592916' },
    nextInvoiceNumber: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
)

export const StoreSettings =
  mongoose.models.StoreSettings ||
  mongoose.model<IStoreSettings>('StoreSettings', storeSettingsSchema)
