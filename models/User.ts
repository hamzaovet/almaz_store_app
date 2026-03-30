import mongoose from 'mongoose'

export interface IUser extends mongoose.Document {
  name: string
  email: string
  username: string
  password?: string
  role: 'مدير' | 'كاشير'
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['مدير', 'كاشير'], default: 'كاشير' },
  },
  { timestamps: true }
)

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema)
