import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get('authorization');
  const url = request.nextUrl;

  // القفل هيطبق بس على روابط الداش بورد
  if (url.pathname.startsWith('/dashboard')) {
    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      if (user === 'admin' && pwd === '123456') {
        return NextResponse.next();
      }
    }

    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Dashboard"',
      },
    });
  }

  return NextResponse.next();
}

// الماتشر ده هو اللي بيعرف فيرسل يطبق الكود فين
export const config = {
  matcher: ['/dashboard/:path*'],
};