import { connectDB } from '@/lib/db'
import Category from '@/models/Category'
import Product from '@/models/Product'
import { StorefrontClient } from '@/components/StorefrontClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  await connectDB()
  
  // Fetch categories and products from Mongoose
  const categories = await Category.find({}).sort({ createdAt: -1 }).lean()
  const products = await Product.find({}).sort({ createdAt: -1 }).lean()

  // Convert Mongoose documents (with ObjectId, Date fields) to plain JSON objects
  const plainCategories = JSON.parse(JSON.stringify(categories))
  const plainProducts = JSON.parse(JSON.stringify(products))

  return (
    <StorefrontClient 
      categories={plainCategories} 
      products={plainProducts} 
    />
  )
}
