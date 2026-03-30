import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // حماية الداش بورد فقط
  if (url.pathname.startsWith('/dashboard')) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return new NextResponse('Auth Required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
      });
    }

    const auth = atob(authHeader.split(' ')[1]);
    const [user, pwd] = auth.split(':');

    if (user === 'admin' && pwd === '123456') {
      return NextResponse.next();
    }

    return new NextResponse('Invalid Credentials', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
    });
  }

  return NextResponse.next();
}

// الماتشر ده هو "المخبر" اللي بيراقب الروابط
export const config = {
  matcher: ['/dashboard/:path*'],
}