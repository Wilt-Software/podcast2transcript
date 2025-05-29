import { NextResponse } from 'next/server'
import { BlogService } from '@/lib/blog-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const podcastSlug = searchParams.get('slug') || 'empowering-leaders-podcast-with-luke-darcy'
    
    console.log('⚡ Testing FAST podcast loading for:', podcastSlug)
    const startTime = Date.now()
    
    const blogService = BlogService.getInstance()
    
    // Clear cache to ensure fresh test
    blogService.clearCache()
    
    const podcast = await blogService.getPodcast(podcastSlug)
    
    const endTime = Date.now()
    const loadTime = endTime - startTime
    
    if (podcast) {
      console.log(`⚡ FAST approach loaded ${podcast.episodeCount} episodes in ${loadTime}ms`)
      
      return NextResponse.json({
        success: true,
        approach: 'FAST - Titles Only',
        loadTime: `${loadTime}ms`,
        podcast: {
          name: podcast.name,
          slug: podcast.slug,
          episodeCount: podcast.episodeCount,
          description: podcast.description,
          sampledEpisodes: podcast.episodes.slice(0, 3).map(ep => ({
            title: ep.title,
            slug: ep.slug,
            publishedAt: ep.publishedAt,
            hasContent: ep.content.length > 0,
            hasTimestamps: ep.timestamps.length > 0
          }))
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Podcast not found',
        loadTime: `${loadTime}ms`
      })
    }

  } catch (error) {
    console.error('❌ Fast podcast test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test fast podcast loading',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 