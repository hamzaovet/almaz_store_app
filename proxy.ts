import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Next.js بيشترط وجود "default export" عشان يعتبر الملف ده middleware حقيقي
export default function proxy(request: NextRequest) {
  const url = request.nextUrl;

  // الحماية هتتنفذ بس لو الرابط بيبدأ بـ /dashboard
  if (url.pathname.startsWith('/dashboard')) {
    const basicAuth = request.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      // اليوزر والباسوورد بتوعنا
      if (user === 'admin' && pwd === '123456') {
        return NextResponse.next();
      }
    }

    // لو البيانات غلط أو مش موجودة، طلع شاشة الباسوورد (زي اللي في صورتك رقم 4)
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Dashboard"',
      },
    });
  }

  return NextResponse.next();
}

// الـ Matcher السحري اللي بيعرف Vercel يطبق الحماية على إيه
export const config = {
  matcher: ['/dashboard/:path*'],
};