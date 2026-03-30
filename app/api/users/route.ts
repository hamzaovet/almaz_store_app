import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { hashPassword } from '@/lib/auth'

export async function GET() {
  try {
    await connectDB()
    // Don't leak passwords in the GET endpoint!
    const users = await User.find({}).select('-password').sort({ createdAt: -1 })
    
    // Map _id to id to match the UI typings
    const mapped = users.map(u => ({
      id: u._id.toString(),
      name: u.name,
      username: u.username,
      email: u.email,
      role: u.role
    }))

    return NextResponse.json({ users: mapped })
  } catch (error) {
    console.error('[Users API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const { name, email, username, role, password } = await req.json()

    if (!name || !email || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] })
    if (existing) {
      return NextResponse.json({ error: 'المستخدم موجود مسبقاً (البريد أو اسم المستخدم مستخدم بالفعل)' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    
    const user = await User.create({
      name,
      email,
      username,
      role: role || 'كاشير',
      password: hashedPassword
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('[Users API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 })

    await connectDB()
    await User.findByIdAndDelete(id)
    return NextResponse.json({ success: true, message: 'User deleted' })
  } catch (error) {
    console.error('[Users API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
