import { NextRequest, NextResponse } from 'next/server'

// ── Credentials ─────────────────────────────────────────────
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'almaz2026'

// ── Route matcher: protect /dashboard and all sub-paths ─────
export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
}

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (authHeader) {
    // Authorization: Basic <base64(username:password)>
    const [scheme, encoded] = authHeader.split(' ')

    if (scheme.toLowerCase() === 'basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
      const colonIndex = decoded.indexOf(':')
      const username = decoded.slice(0, colonIndex)
      const password = decoded.slice(colonIndex + 1)

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Authenticated — let the request through
        return NextResponse.next()
      }
    }
  }

  // Not authenticated — challenge the browser
  return new NextResponse('Unauthorized — Almaz Dashboard', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Almaz Dashboard", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
