import { connectDB } from '@/lib/db'
import Category from '@/models/Category'
import Product from '@/models/Product'
import { CategoryClient } from './CategoryClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  await connectDB()
  
  const { slug } = params
  
  // Fetch the Category by slug
  const categoryDoc = await Category.findOne({ slug: slug.toLowerCase() }).lean()
  if (!categoryDoc) {
    notFound()
  }

  // Fetch Products where categoryId matches this Category's ID
  const productsDocs = await Product.find({ categoryId: categoryDoc._id }).sort({ createdAt: -1 }).lean()

  const category = JSON.parse(JSON.stringify(categoryDoc))
  const products = JSON.parse(JSON.stringify(productsDocs))

  return (
    <CategoryClient 
      category={category} 
      products={products} 
    />
  )
}
