import { NextResponse } from 'next/server'
import { BlogService } from '@/lib/blog-service'

export async function GET() {
  try {
    console.log('Testing podcast loading...')
    const startTime = Date.now()
    
    const blogService = BlogService.getInstance()
    const podcasts = await blogService.getAllPodcastsLight()
    
    const endTime = Date.now()
    const loadTime = endTime - startTime
    
    return NextResponse.json({
      success: true,
      loadTime: `${loadTime}ms`,
      podcastCount: podcasts.length,
      podcasts: podcasts.map(p => ({
        name: p.name,
        slug: p.slug,
        episodeCount: p.episodeCount,
        description: p.description
      }))
    })

  } catch (error) {
    console.error('Error testing podcasts:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to load podcasts',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 