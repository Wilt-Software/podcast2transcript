import { MetadataRoute } from 'next'
import { BlogService } from '@/lib/blog-service'
import { generateSitemapEntries } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com'
  
  const blogService = BlogService.getInstance()
  const podcasts = await blogService.getAllPodcasts()
  
  const blogEntries = generateSitemapEntries(podcasts)
  
  // Main site pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  // Convert blog entries to sitemap format
  const dynamicPages: MetadataRoute.Sitemap = blogEntries.map(entry => ({
    url: entry.url,
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }))

  return [...staticPages, ...dynamicPages]
} 