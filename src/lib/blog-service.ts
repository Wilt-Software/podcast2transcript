import { supabaseAdmin, supabaseStorage } from './supabase'
import { PodcastEpisode, Podcast, TimestampEntry } from '@/types/blog'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

/**
 * Blog Service - Podcast Episode Management
 * 
 * IMPORTANT: This service uses a unified slug creation system that matches:
 * - populate_episodes.py (for database population)
 * - upload_to_supabase.py (for file uploads)
 * 
 * Any changes to slug creation must be synchronized across all three systems
 * to ensure consistent URLs and file paths.
 */

// Database episode interface matching your schema
interface DatabaseEpisode {
  id: number
  podcast_name: string
  episode_title: string
  file_path: string
  slug: string
  podcast_slug: string
  file_size: number
  created_at: string
  updated_at: string
  content_preview: string | null
  word_count: number
  duration_estimate: number
}

export class BlogService {
  private static instance: BlogService
  private cache: Map<string, unknown> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): BlogService {
    if (!BlogService.instance) {
      BlogService.instance = new BlogService()
    }
    return BlogService.instance
  }

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key)
    return expiry ? Date.now() < expiry : false
  }

  private setCache(key: string, value: unknown): void {
    this.cache.set(key, value)
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION)
  }

  private getCache(key: string): unknown {
    if (this.isCacheValid(key)) {
      return this.cache.get(key)
    }
    this.cache.delete(key)
    this.cacheExpiry.delete(key)
    return null
  }

  /**
   * 🚀 SUPER FAST: Get all episodes from database (~50ms vs 1,600ms)
   */
  async getAllEpisodesFromDB(): Promise<DatabaseEpisode[]> {
    const cacheKey = 'all-episodes-db'
    const cached = this.getCache(cacheKey)
    if (cached) return cached as DatabaseEpisode[]

    try {
      console.log('🗄️ Fetching episodes from database...')
      const startTime = Date.now()
      
      const { data, error } = await supabaseAdmin
        .from('episodes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Remove duplicates based on unique key (podcast_slug + slug) to prevent React key conflicts
      const uniqueEpisodes = new Map<string, any>()
      data?.forEach(dbEpisode => {
        const uniqueKey = `${dbEpisode.podcast_slug}-${dbEpisode.slug}`
        if (!uniqueEpisodes.has(uniqueKey)) {
          uniqueEpisodes.set(uniqueKey, dbEpisode)
        } else {
          console.warn(`🔄 Duplicate episode detected: ${uniqueKey} - skipping duplicate`)
        }
      })

      const deduplicatedData = Array.from(uniqueEpisodes.values())

      const duration = Date.now() - startTime
      console.log(`✅ Database query completed in ${duration}ms (${deduplicatedData.length} unique episodes)`)
      
      this.setCache(cacheKey, deduplicatedData)
      return deduplicatedData
    } catch (error) {
      console.error('❌ Error fetching episodes from database:', error)
      return []
    }
  }

  /**
   * 🚀 SUPER FAST: Get podcasts from database (~10ms vs 1,600ms)
   */
  async getAllPodcastsFromDB(): Promise<Podcast[]> {
    const cacheKey = 'all-podcasts-db'
    const cached = this.getCache(cacheKey)
    if (cached) return cached as Podcast[]

    try {
      console.log('📊 Aggregating podcasts from database...')
      const startTime = Date.now()
      
      // Get aggregated podcast data
      const { data, error } = await supabaseAdmin
        .from('episodes')
        .select(`
          podcast_name,
          podcast_slug,
          created_at,
          file_size
        `)

      if (error) throw error

      // Group by podcast
      const podcastMap = new Map<string, {
        name: string
        slug: string
        episodeCount: number
        totalSize: number
        latestEpisode: Date
      }>()

      data?.forEach(episode => {
        const slug = episode.podcast_slug
        const existing = podcastMap.get(slug)
        
        if (existing) {
          existing.episodeCount++
          existing.totalSize += episode.file_size || 0
          const episodeDate = new Date(episode.created_at)
          if (episodeDate > existing.latestEpisode) {
            existing.latestEpisode = episodeDate
          }
        } else {
          podcastMap.set(slug, {
            name: episode.podcast_name,
            slug: episode.podcast_slug,
            episodeCount: 1,
            totalSize: episode.file_size || 0,
            latestEpisode: new Date(episode.created_at)
          })
        }
      })

      const podcasts: Podcast[] = Array.from(podcastMap.values()).map(p => ({
        name: p.name,
        slug: p.slug,
        episodes: [], // Will be loaded on-demand
        episodeCount: p.episodeCount,
        latestEpisode: p.latestEpisode,
        description: `Browse ${p.episodeCount} episode transcripts from ${p.name}`
      }))

      const duration = Date.now() - startTime
      console.log(`✅ Podcast aggregation completed in ${duration}ms (${podcasts.length} podcasts)`)
      
      this.setCache(cacheKey, podcasts)
      return podcasts
    } catch (error) {
      console.error('❌ Error fetching podcasts from database:', error)
      return []
    }
  }

  /**
   * 🚀 SUPER FAST: Get single podcast with episodes from database (~30ms vs 1,600ms)
   */
  async getPodcastFromDB(podcastSlug: string): Promise<Podcast | null> {
    const cacheKey = `podcast-db-${podcastSlug}`
    const cached = this.getCache(cacheKey)
    if (cached) return cached as Podcast

    try {
      console.log(`🎙️ Fetching podcast ${podcastSlug} from database...`)
      const startTime = Date.now()
      
      const { data, error } = await supabaseAdmin
        .from('episodes')
        .select('*')
        .eq('podcast_slug', podcastSlug)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!data || data.length === 0) return null

      // Remove duplicates based on slug to prevent React key conflicts
      const uniqueEpisodes = new Map<string, any>()
      data.forEach(dbEpisode => {
        if (!uniqueEpisodes.has(dbEpisode.slug)) {
          uniqueEpisodes.set(dbEpisode.slug, dbEpisode)
        } else {
          console.warn(`🔄 Duplicate episode slug detected: ${dbEpisode.slug} - skipping duplicate`)
        }
      })

      // Convert database episodes to PodcastEpisode format
      const episodes: PodcastEpisode[] = Array.from(uniqueEpisodes.values()).map(dbEpisode => ({
        id: `${dbEpisode.podcast_slug}-${dbEpisode.slug}`,
        title: dbEpisode.episode_title,
        podcastName: dbEpisode.podcast_name,
        slug: dbEpisode.slug,
        podcastSlug: dbEpisode.podcast_slug,
        content: '', // Will be loaded on-demand
        rawContent: '',
        timestamps: [], // Will be loaded on-demand
        duration: dbEpisode.duration_estimate > 0 ? `${Math.floor(dbEpisode.duration_estimate / 60)}:${(dbEpisode.duration_estimate % 60).toString().padStart(2, '0')}` : undefined,
        publishedAt: new Date(dbEpisode.created_at),
        description: dbEpisode.content_preview || `Episode transcript for ${dbEpisode.episode_title}`,
        keywords: [],
        filePath: dbEpisode.file_path
      }))

      const podcast: Podcast = {
        name: data[0].podcast_name,
        slug: podcastSlug,
        episodes,
        episodeCount: episodes.length,
        latestEpisode: episodes[0]?.publishedAt || new Date(),
        description: `Browse ${episodes.length} episode transcripts from ${data[0].podcast_name}`
      }

      const duration = Date.now() - startTime
      console.log(`✅ Podcast query completed in ${duration}ms (${episodes.length} unique episodes)`)
      
      this.setCache(cacheKey, podcast)
      return podcast
    } catch (error) {
      console.error(`❌ Error fetching podcast ${podcastSlug} from database:`, error)
      return null
    }
  }

  /**
   * 🚀 SUPER FAST: Get single episode from database (~20ms vs 1,600ms)
   */
  async getEpisodeFromDB(podcastSlug: string, episodeSlug: string): Promise<PodcastEpisode | null> {
    const cacheKey = `episode-db-${podcastSlug}-${episodeSlug}`
    const cached = this.getCache(cacheKey)
    if (cached) return cached as PodcastEpisode

    try {
      console.log(`📄 Fetching episode ${episodeSlug} from database...`)
      const startTime = Date.now()
      
      const { data, error } = await supabaseAdmin
        .from('episodes')
        .select('*')
        .eq('podcast_slug', podcastSlug)
        .eq('slug', episodeSlug)
        .single()

      if (error) throw error
      if (!data) return null

      const duration = Date.now() - startTime
      console.log(`✅ Episode metadata query completed in ${duration}ms`)

      // Now download the actual content (this is the remaining ~870ms)
      const content = await this.getFileContent(data.file_path)
      if (!content) return null

      const { data: frontmatter, content: markdownContent } = matter(content)
      const timestamps = this.parseTimestamps(markdownContent)
      const processedContent = await this.processMarkdownContent(markdownContent)

      const episode: PodcastEpisode = {
        id: `${data.podcast_slug}-${data.slug}`,
        title: data.episode_title,
        podcastName: data.podcast_name,
        slug: data.slug,
        podcastSlug: data.podcast_slug,
        content: processedContent,
        rawContent: markdownContent,
        timestamps,
        duration: frontmatter.duration || (data.duration_estimate > 0 ? `${Math.floor(data.duration_estimate / 60)}:${(data.duration_estimate % 60).toString().padStart(2, '0')}` : undefined),
        publishedAt: new Date(data.created_at),
        description: frontmatter.description || data.content_preview || this.generateDescription(markdownContent),
        keywords: frontmatter.keywords || this.extractKeywords(markdownContent),
        filePath: data.file_path
      }

      this.setCache(cacheKey, episode)
      return episode
    } catch (error) {
      console.error(`❌ Error fetching episode ${podcastSlug}/${episodeSlug} from database:`, error)
      return null
    }
  }

  // 🔄 LEGACY FALLBACK METHODS (for backward compatibility)
  async getAllFiles(): Promise<string[]> {
    console.log('⚠️ Using legacy getAllFiles - consider migrating to database methods')
    const episodes = await this.getAllEpisodesFromDB()
    return episodes.map(ep => ep.file_path)
  }

  async getAllPodcastsLight(): Promise<Podcast[]> {
    console.log('🚀 Redirecting to fast database method...')
    return this.getAllPodcastsFromDB()
  }

  async getAllPodcasts(): Promise<Podcast[]> {
    console.log('🚀 Redirecting to fast database method...')
    return this.getAllPodcastsFromDB()
  }

  async getPodcast(podcastSlug: string): Promise<Podcast | null> {
    console.log('🚀 Redirecting to fast database method...')
    return this.getPodcastFromDB(podcastSlug)
  }

  async getEpisode(podcastSlug: string, episodeSlug: string): Promise<PodcastEpisode | null> {
    console.log('🚀 Redirecting to fast database method...')
    return this.getEpisodeFromDB(podcastSlug, episodeSlug)
  }

  // 🗂️ STORAGE HELPER METHODS (unchanged)
  async getFileContent(filePath: string): Promise<string | null> {
    const cacheKey = `file-${filePath}`
    const cached = this.getCache(cacheKey)
    if (cached) return cached as string

    try {
      const { data, error } = await supabaseStorage.storage
        .from('transcripts')
        .download(filePath)

      if (error) throw error

      const content = await data.text()
      this.setCache(cacheKey, content)
      return content
    } catch (error) {
      console.error(`Error fetching file ${filePath}:`, error)
      return null
    }
  }

  private parseTimestamps(content: string): TimestampEntry[] {
    const timestampRegex = /\*\*(\d{1,2}:\d{2}:\d{2})\*\*\s*—\s*(.+?)(?=\*\*\d{1,2}:\d{2}:\d{2}\*\*|$)/gs
    const timestamps: TimestampEntry[] = []
    let match

    while ((match = timestampRegex.exec(content)) !== null) {
      const [, timestamp, text] = match
      const timeInSeconds = this.timestampToSeconds(timestamp)
      
      timestamps.push({
        timestamp,
        text: text.trim(),
        timeInSeconds
      })
    }

    return timestamps
  }

  private timestampToSeconds(timestamp: string): number {
    const parts = timestamp.split(':').map(Number)
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return 0
  }

  private createSlug(text: string): string {
    // Unified slug creation function - matches populate_episodes.py and upload_to_supabase.py
    let slug = text.toLowerCase()
    
    // Replace smart quotes and special punctuation
    slug = slug.replace(/'/g, "'")    // Replace smart quotes
    slug = slug.replace(/'/g, "'")
    slug = slug.replace(/"/g, '"')
    slug = slug.replace(/"/g, '"')
    slug = slug.replace(/–/g, '-')    // Replace en dash
    slug = slug.replace(/—/g, '-')    // Replace em dash
    slug = slug.replace(/…/g, '...')  // Replace ellipsis with three dots
    
    // Remove all punctuation except hyphens and dots, keep alphanumeric and spaces
    slug = slug.replace(/[^\w\s.-]/g, '')
    
    // Replace multiple spaces and dots with single hyphen
    slug = slug.replace(/[\s.]+/g, '-')
    
    // Replace multiple hyphens with single hyphen
    slug = slug.replace(/-+/g, '-')
    
    // Remove leading/trailing hyphens
    slug = slug.replace(/^-+|-+$/g, '')
    
    // Limit length to avoid extremely long URLs
    if (slug.length > 100) {
      slug = slug.substring(0, 100).replace(/-+$/, '')
    }
    
    return slug
  }

  private async processMarkdownContent(content: string): Promise<string> {
    const processedMarkdown = remark()
      .use(html)
    
    const result = await processedMarkdown.process(content)
    return result.toString()
  }

  private generateDescription(content: string): string {
    // Extract first few sentences from the transcript
    const cleanContent = content.replace(/\*\*\d{1,2}:\d{2}:\d{2}\*\*\s*—\s*/g, '')
    const sentences = cleanContent.split(/[.!?]+/).slice(0, 3)
    return sentences.join('. ').substring(0, 160) + '...'
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - in production, you might want to use a more sophisticated approach
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4)
    
    const wordCount = new Map<string, number>()
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }

  clearCache(): void {
    this.cache.clear()
    this.cacheExpiry.clear()
  }
} 