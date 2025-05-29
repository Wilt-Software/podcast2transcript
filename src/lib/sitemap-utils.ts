import { BlogService } from './blog-service'

export interface SitemapUrl {
  loc: string
  lastmod: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: string
}

export const ITEMS_PER_SITEMAP = 100

export async function generateSitemapUrls(baseUrl: string): Promise<SitemapUrl[]> {
  const blogService = BlogService.getInstance()
  const urls: SitemapUrl[] = []
  
  console.log('🔄 Starting sitemap URL generation...')
  
  try {
    // 1. Static pages (highest priority)
    urls.push(
      {
        loc: baseUrl,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        loc: `${baseUrl}/blog`,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '0.8'
      }
    )

    // 2. Get podcasts using light loading for speed
    const podcasts = await blogService.getAllPodcastsLight()
    console.log(`📊 Found ${podcasts.length} podcasts`)
    
    // 3. Add podcast pages
    for (const podcast of podcasts) {
      urls.push({
        loc: `${baseUrl}/blog/${podcast.slug}`,
        lastmod: podcast.latestEpisode ? podcast.latestEpisode.toISOString() : new Date().toISOString(),
        changefreq: 'weekly',
        priority: '0.7'
      })
    }

    // 4. Add episodes - process podcasts in batches to avoid memory issues
    const BATCH_SIZE = 2 // Process 2 podcasts at a time
    for (let i = 0; i < podcasts.length; i += BATCH_SIZE) {
      const batch = podcasts.slice(i, i + BATCH_SIZE)
      
      await Promise.all(
        batch.map(async (podcast) => {
          try {
            console.log(`📄 Processing episodes for ${podcast.name}...`)
            
            // Get full podcast data with episodes
            const fullPodcast = await blogService.getPodcast(podcast.slug)
            
            if (fullPodcast && fullPodcast.episodes.length > 0) {
              console.log(`  ✓ Adding ${fullPodcast.episodes.length} episodes`)
              
              for (const episode of fullPodcast.episodes) {
                urls.push({
                  loc: `${baseUrl}/blog/${episode.podcastSlug}/${episode.slug}`,
                  lastmod: episode.publishedAt.toISOString(),
                  changefreq: 'monthly',
                  priority: '0.6'
                })
              }
            }
          } catch (error) {
            console.error(`⚠️ Error loading episodes for ${podcast.slug}:`, error)
            // Continue with other podcasts even if one fails
          }
        })
      )
      
      // Small delay between batches to prevent overwhelming the system
      if (i + BATCH_SIZE < podcasts.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`✅ Generated ${urls.length} total URLs for sitemap`)
    return urls
    
  } catch (error) {
    console.error('❌ Error generating sitemap URLs:', error)
    
    // Return minimal URLs on error
    return [
      {
        loc: baseUrl,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        loc: `${baseUrl}/blog`,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '0.8'
      }
    ]
  }
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

export function calculateTotalSitemaps(totalUrls: number): number {
  return Math.ceil(totalUrls / ITEMS_PER_SITEMAP)
}

export function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`
}

export function generateSitemapIndexXml(baseUrl: string, totalSitemaps: number): string {
  const sitemaps = Array.from({ length: totalSitemaps }, (_, i) => {
    const sitemapNumber = i + 1
    return `  <sitemap>
    <loc>${baseUrl}/sitemap-${sitemapNumber}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`
} 