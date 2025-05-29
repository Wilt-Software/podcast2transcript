import { NextResponse } from 'next/server'
import { BlogService } from '@/lib/blog-service'
import { ITEMS_PER_SITEMAP, generateSitemapIndexXml } from '@/lib/sitemap-utils'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com'
  
  try {
    // Get total count efficiently using light loading
    const blogService = BlogService.getInstance()
    const podcasts = await blogService.getAllPodcastsLight()
    
    // Calculate total URLs: static pages + podcast pages + all episodes
    const staticPagesCount = 2 // home + blog index
    const podcastPagesCount = podcasts.length
    const totalEpisodesCount = podcasts.reduce((total, podcast) => total + podcast.episodeCount, 0)
    
    const totalUrls = staticPagesCount + podcastPagesCount + totalEpisodesCount
    const totalSitemaps = Math.ceil(totalUrls / ITEMS_PER_SITEMAP)
    
    console.log(`📋 Generating sitemap index: ${totalUrls} total URLs across ${totalSitemaps} sitemaps`)
    
    const sitemapIndexXml = generateSitemapIndexXml(baseUrl, totalSitemaps)

    return new NextResponse(sitemapIndexXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600' // Cache for 1 hour
      }
    })
  } catch (error) {
    console.error('❌ Error generating sitemap index:', error)
    
    // Return a minimal sitemap index on error
    const errorSitemapXml = generateSitemapIndexXml(baseUrl, 1)

    return new NextResponse(errorSitemapXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes on error
      }
    })
  }
} 