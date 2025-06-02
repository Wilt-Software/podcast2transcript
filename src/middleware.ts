import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Handle sitemap-[page].xml requests
  const sitemapMatch = pathname.match(/^\/sitemap-(\d+)\.xml$/)
  if (sitemapMatch) {
    const pageNumber = sitemapMatch[1]
    const rewriteUrl = `/api/sitemap?page=${pageNumber}`
    const url = new URL(rewriteUrl, request.url)
    return NextResponse.rewrite(url)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/sitemap-:path*.xml',
  ],
} 