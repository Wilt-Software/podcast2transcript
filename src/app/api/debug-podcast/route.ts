import { NextResponse } from 'next/server'
import { BlogService } from '@/lib/blog-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const podcastSlug = searchParams.get('slug') || 'empowering-leaders-podcast-with-luke-darcy'
    const clearCache = searchParams.get('clear') === 'true'
    
    console.log('🔍 Debug: Testing podcast slug:', podcastSlug)
    
    const blogService = BlogService.getInstance()
    
    // Clear cache if requested
    if (clearCache) {
      console.log('🧹 Clearing cache...')
      blogService.clearCache()
    }

    // First, let's see what podcasts are available
    console.log('📂 Getting all podcasts light...')
    const allPodcastsLight = await blogService.getAllPodcastsLight()
    console.log('📂 Found podcasts:', allPodcastsLight.map(p => ({ name: p.name, slug: p.slug })))
    
    // Try to get the specific podcast
    console.log('🎯 Trying to get podcast:', podcastSlug)
    const podcast = await blogService.getPodcast(podcastSlug)
    
    if (podcast) {
      console.log('✅ Found podcast:', podcast.name, 'with', podcast.episodeCount, 'episodes')
      
      // Check for duplicate episode slugs
      const episodeSlugs = podcast.episodes.map(ep => ep.slug)
      const uniqueSlugs = new Set(episodeSlugs)
      if (episodeSlugs.length !== uniqueSlugs.size) {
        console.warn('⚠️ Duplicate episode slugs detected!')
        const duplicates = episodeSlugs.filter((slug, index, arr) => arr.indexOf(slug) !== index)
        console.warn('⚠️ Duplicate slugs:', [...new Set(duplicates)])
      }
    } else {
      console.log('❌ Podcast not found for slug:', podcastSlug)
    }
    
    // Let's also check what the original directory names are
    console.log('📁 Getting all files to check directory names...')
    const allFiles = await blogService.getAllFiles()
    const uniqueDirs = [...new Set(allFiles.map(file => file.split('/')[0]))]
    console.log('📁 Original directory names:', uniqueDirs)
    
    // Let's see what slugs they generate
    const dirToSlugMap = uniqueDirs.map(dir => ({
      original: dir,
      slug: dir.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    }))
    console.log('🏷️ Directory to slug mapping:', dirToSlugMap)
    
    return NextResponse.json({
      success: true,
      requestedSlug: podcastSlug,
      cacheCleared: clearCache,
      foundPodcast: podcast ? {
        name: podcast.name,
        slug: podcast.slug,
        episodeCount: podcast.episodeCount,
        description: podcast.description,
        hasEpisodes: podcast.episodes.length > 0,
        duplicateEpisodesCheck: {
          totalEpisodes: podcast.episodes.length,
          uniqueSlugs: new Set(podcast.episodes.map(ep => ep.slug)).size,
          hasDuplicates: podcast.episodes.length !== new Set(podcast.episodes.map(ep => ep.slug)).size
        }
      } : null,
      allPodcastsLight: allPodcastsLight.map(p => ({ name: p.name, slug: p.slug, episodeCount: p.episodeCount })),
      originalDirectories: uniqueDirs,
      directoryToSlugMapping: dirToSlugMap,
      totalFiles: allFiles.length
    })

  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to debug podcast',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 