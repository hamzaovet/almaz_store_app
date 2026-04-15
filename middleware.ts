import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge } from './lib/auth'

export async function middleware(request: NextRequest) {
  // Only protect /dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('almaz_auth')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      // Use Edge compatible verifier
      const payload = await verifyTokenEdge(token)
      if (!payload) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      
      // Successfully authenticated
      const role = payload.role as string

      // Cashier Security Lock
      if (role === 'Cashier' || role === 'كاشير') {
        const path = request.nextUrl.pathname
        const blockedPaths = [
          '/dashboard/reports', 
          '/dashboard/treasury', 
          '/dashboard/expenses', 
          '/dashboard/employees', 
          '/dashboard/settings',
          '/dashboard/branches'
        ]
        
        if (blockedPaths.some(bp => path.startsWith(bp))) {
          // Block access and redirect them exactly to where they belong
          return NextResponse.redirect(new URL('/dashboard/sales', request.url))
        }
      }

      const res = NextResponse.next()
      res.headers.set('x-user-data', JSON.stringify(payload))
      return res
    } catch (error) {
      console.error('[Middleware] Token verification failed:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
}
