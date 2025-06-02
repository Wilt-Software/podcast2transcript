import { NextRequest, NextResponse } from 'next/server'
import { resetSitemapCache } from '../../sitemap/route'
import { BlogService } from '@/lib/blog-service'

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 New transcript webhook received')
    
    // Verify webhook secret if provided (optional security measure)
    const authHeader = request.headers.get('authorization')
    const webhookSecret = process.env.WEBHOOK_SECRET
    
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      console.warn('❌ Unauthorized webhook request')
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    // Parse request body (optional - can contain metadata about the new transcript)
    let body
    try {
      body = await request.json()
      console.log('📄 Webhook payload:', body)
    } catch (error) {
      // Body parsing is optional
      console.log('📄 Webhook received without JSON payload')
    }
    
    // Reset the sitemap cache
    resetSitemapCache()
    
    // Clear blog service caches to ensure new transcript appears
    console.log('🔄 Clearing blog service caches...')
    const podcastSlug = body?.transcript?.podcastSlug
    BlogService.clearCacheExternal(podcastSlug)
    
    // Trigger a background refresh of the sitemap URLs
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com'
    
    // Don't await this - let it run in background
    fetch(`${baseUrl}/api/sitemap?page=1&invalidate=true`)
      .then(() => console.log('✅ Sitemap cache refreshed in background'))
      .catch(error => console.error('⚠️ Background sitemap refresh failed:', error))
    
    return NextResponse.json({
      success: true,
      message: 'Sitemap and blog caches invalidated successfully',
      timestamp: new Date().toISOString(),
      transcriptInfo: body || null
    })
    
  } catch (error) {
    console.error('❌ Error in new transcript webhook:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}

// Also support GET for testing purposes
export async function GET() {
  console.log('🧪 Test webhook call received')
  resetSitemapCache()
  BlogService.clearCacheExternal()
  
  return NextResponse.json({
    success: true,
    message: 'Test webhook - sitemap and blog caches invalidated',
    timestamp: new Date().toISOString()
  })
} 