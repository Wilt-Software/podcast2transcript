import { NextRequest, NextResponse } from 'next/server'
import { generateSitemapUrls, ITEMS_PER_SITEMAP, generateSitemapXml, SitemapUrl } from '@/lib/sitemap-utils'
import { getSitemapCache, setSitemapCache, resetSitemapCache } from '@/lib/sitemap-cache'

// Cache duration
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com'
  
  try {
    // Check for cache invalidation flag
    const invalidateCache = request.nextUrl.searchParams.get('invalidate') === 'true'
    
    if (invalidateCache) {
      resetSitemapCache()
    }

    // Extract page number from the original URL path (for middleware rewrites)
    const pathname = new URL(request.url).pathname
    const sitemapMatch = pathname.match(/^\/sitemap-(\d+)\.xml$/)
    
    let pageParam: string | null = null
    
    if (sitemapMatch) {
      // Request came from middleware rewrite (sitemap-1.xml)
      pageParam = sitemapMatch[1]
    } else {
      // Direct API call with query parameter
      pageParam = request.nextUrl.searchParams.get('page')
    }
    
    if (!pageParam) {
      return new NextResponse('Page parameter is required', { status: 400 })
    }
    
    const pageNumber = parseInt(pageParam)
    
    if (isNaN(pageNumber) || pageNumber < 1) {
      return new NextResponse('Invalid page number', { status: 400 })
    }

    console.log(`📄 Generating sitemap page ${pageNumber}`)

    // Get current cache state
    const { urlsCache, cacheTimestamp } = getSitemapCache()

    // Check if we need to regenerate the URLs cache
    const now = Date.now()
    let currentUrlsCache = urlsCache
    
    if (!currentUrlsCache || (now - cacheTimestamp) > CACHE_DURATION) {
      console.log('🔄 Regenerating sitemap URLs cache...')
      currentUrlsCache = await generateSitemapUrls(baseUrl)
      setSitemapCache(currentUrlsCache, now)
    } else {
      console.log('📋 Using cached sitemap URLs')
    }
    
    // Calculate pagination
    const startIndex = (pageNumber - 1) * ITEMS_PER_SITEMAP
    const endIndex = startIndex + ITEMS_PER_SITEMAP
    const urlsForThisPage = currentUrlsCache.slice(startIndex, endIndex)
    
    if (urlsForThisPage.length === 0) {
      return new NextResponse('Page not found', { status: 404 })
    }

    // Generate XML for this page
    const sitemapXml = generateSitemapXml(urlsForThisPage)

    console.log(`✅ Generated sitemap page ${pageNumber} with ${urlsForThisPage.length} URLs`)

    return new NextResponse(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600' // Cache for 1 hour
      }
    })

  } catch (error) {
    console.error(`❌ Error generating sitemap:`, error)
    
    // Return minimal sitemap on error
    const errorUrls: SitemapUrl[] = [
      {
        loc: baseUrl,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '1.0'
      }
    ]
    
    const errorSitemapXml = generateSitemapXml(errorUrls)

    return new NextResponse(errorSitemapXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes on error
      }
    })
  }
} 