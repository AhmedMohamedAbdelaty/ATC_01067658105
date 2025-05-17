import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Add CORS headers for API proxy routes
    if (request.nextUrl.pathname.startsWith('/api/proxy')) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 200,
                headers: response.headers,
            });
        }
    }

    return response;
}

// Configure the matcher to only run middleware on API proxy routes
export const config = {
    matcher: [
        '/((?!api/proxy|_next/static|_next/image|favicon.ico).*)',
    ],
};
