import { NextRequest, NextResponse } from 'next/server'
import { generateSitemapUrls, ITEMS_PER_SITEMAP, generateSitemapXml, SitemapUrl } from '@/lib/sitemap-utils'

interface RouteParams {
  params: Promise<{
    page: string
  }>
}

// Cache for sitemap URLs to avoid regenerating them for each page
let urlsCache: SitemapUrl[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export async function GET(request: NextRequest, { params }: RouteParams) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com'
  
  try {
    const resolvedParams = await params
    const pageNumber = parseInt(resolvedParams.page)
    
    if (isNaN(pageNumber) || pageNumber < 1) {
      return new NextResponse('Invalid page number', { status: 400 })
    }

    console.log(`📄 Generating sitemap page ${pageNumber}`)

    // Check if we need to regenerate the URLs cache
    const now = Date.now()
    if (!urlsCache || (now - cacheTimestamp) > CACHE_DURATION) {
      console.log('🔄 Regenerating sitemap URLs cache...')
      urlsCache = await generateSitemapUrls(baseUrl)
      cacheTimestamp = now
    } else {
      console.log('📋 Using cached sitemap URLs')
    }
    
    // Calculate pagination
    const startIndex = (pageNumber - 1) * ITEMS_PER_SITEMAP
    const endIndex = startIndex + ITEMS_PER_SITEMAP
    const urlsForThisPage = urlsCache.slice(startIndex, endIndex)
    
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
    const resolvedParams = await params
    console.error(`❌ Error generating sitemap page ${resolvedParams?.page}:`, error)
    
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