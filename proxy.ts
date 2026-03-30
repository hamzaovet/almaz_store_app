import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const url = request.nextUrl;

  // الحماية هتشتغل هنا
  if (url.pathname.startsWith('/dashboard')) {
    const basicAuth = request.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      // اليوزر والباسوورد
      if (user === 'admin' && pwd === '123456') {
        return NextResponse.next();
      }
    }

    // لو مفيش بيانات أو البيانات غلط، طلع شاشة الباسوورد
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Dashboard"',
      },
    });
  }

  return NextResponse.next();
}

// 👈 السر كله هنا: الخريطة اللي بتجبر السيرفر يشغل الحماية على الداش بورد
export const config = {
  matcher: ['/dashboard/:path*'],
};