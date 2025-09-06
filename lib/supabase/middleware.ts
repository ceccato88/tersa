import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '../env';

export const updateSession = async (request: NextRequest) => {
  // Bypass auth/session refresh for Next.js Server Actions to avoid unexpected
  // redirects/responses during action POSTs.
  const nextActionHeader = request.headers.get('next-action') ?? request.headers.get('Next-Action');
  if (nextActionHeader) {
    return NextResponse.next();
  }
  // Start with a fresh response; we'll set cookies on the response only.
  // Avoid mutating request cookies to prevent cookie header growth.
  let supabaseResponse = NextResponse.next();

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Only set cookies on the response; do not mutate request cookies
          // to avoid compounding Set-Cookie headers and 431 errors.
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publicPaths = [
    '/',
    '/home',
    '/privacy',
    '/terms',
    '/acceptable-use',
  ];

  if (
    !user &&
    !publicPaths.includes(request.nextUrl.pathname) &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
};
