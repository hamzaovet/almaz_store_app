import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { hashPassword } from '@/lib/auth'

export async function GET() {
  try {
    await connectDB()

    // Delete all existing users as requested
    await User.deleteMany({})

    // Create seed admin
    const hashedPassword = await hashPassword('securepassword123')
    
    const admin = await User.create({
      name: 'Admin Almaz',
      email: 'admin@almazstore.com',
      username: 'admin_almaz',
      password: hashedPassword,
      role: 'مدير',
    })

    return NextResponse.json({
      success: true,
      message: 'Admin seeded successfully. All legacy users dropped.',
      admin: { username: admin.username, role: admin.role, name: admin.name }
    })
  } catch (error) {
    console.error('[Seed API] Error:', error)
    return NextResponse.json({ error: 'Failed to seed admin' }, { status: 500 })
  }
}
