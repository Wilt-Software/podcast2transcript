import { supabaseStorage } from './supabase'
import { PodcastEpisode, Podcast, TimestampEntry } from '@/types/blog'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

interface StorageFileObject {
  name: string
  id?: string
  updated_at?: string
  created_at?: string
  last_accessed_at?: string
  metadata?: Record<string, unknown>
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

  async getAllFiles(): Promise<string[]> {
    const cacheKey = 'all-files'
    const cached = this.getCache(cacheKey)
    if (cached) return cached as string[]

    try {
      const { data, error } = await supabaseStorage.storage
        .from('transcripts')
        .list('', {
          limit: 1000,
          offset: 0,
        })

      if (error) throw error

      const files: string[] = []
      
      // Get all podcast directories
      const podcastDirs = data?.filter((item: StorageFileObject) => item.name && !item.name.includes('.')) || []
      
      for (const dir of podcastDirs) {
        const { data: episodeFiles, error: episodeError } = await supabaseStorage.storage
          .from('transcripts')
          .list(dir.name, {
            limit: 1000,
            offset: 0,
          })

        if (episodeError) {
          console.error(`Error fetching episodes for ${dir.name}:`, episodeError)
          continue
        }

        const markdownFiles = episodeFiles?.filter((file: StorageFileObject) => file.name.endsWith('.md')) || []
        files.push(...markdownFiles.map((file: StorageFileObject) => `${dir.name}/${file.name}`))
      }

      this.setCache(cacheKey, files)
      return files
    } catch (error) {
      console.error('Error fetching files:', error)
      return []
    }
  }

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
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  private async processMarkdownContent(content: string): Promise<string> {
    const processedMarkdown = remark()
      .use(html)
    
    const result = await processedMarkdown.process(content)
    return result.toString()
  }

  async getEpisode(podcastSlug: string, episodeSlug: string): Promise<PodcastEpisode | null> {
    const cacheKey = `episode-${podcastSlug}-${episodeSlug}`
    const cached = this.getCache(cacheKey)
    if (cached) return cached as PodcastEpisode

    try {
      const files = await this.getAllFiles()
      const targetFile = files.find(file => {
        const [podcast, episode] = file.split('/')
        return this.createSlug(podcast) === podcastSlug && 
               this.createSlug(episode.replace('.md', '')) === episodeSlug
      })

      if (!targetFile) return null

      const content = await this.getFileContent(targetFile)
      if (!content) return null

      const { data: frontmatter, content: markdownContent } = matter(content)
      const [podcastName, episodeFileName] = targetFile.split('/')
      const episodeTitle = episodeFileName.replace('.md', '')

      const timestamps = this.parseTimestamps(markdownContent)
      const processedContent = await this.processMarkdownContent(markdownContent)

      const episode: PodcastEpisode = {
        id: `${podcastSlug}-${episodeSlug}`,
        title: frontmatter.title || episodeTitle,
        podcastName: frontmatter.podcastName || podcastName,
        slug: episodeSlug,
        podcastSlug,
        content: processedContent,
        rawContent: markdownContent,
        timestamps,
        duration: frontmatter.duration,
        publishedAt: frontmatter.publishedAt ? new Date(frontmatter.publishedAt) : new Date(),
        description: frontmatter.description || this.generateDescription(markdownContent),
        keywords: frontmatter.keywords || this.extractKeywords(markdownContent),
        filePath: targetFile
      }

      this.setCache(cacheKey, episode)
      return episode
    } catch (error) {
      console.error(`Error getting episode ${podcastSlug}/${episodeSlug}:`, error)
      return null
    }
  }

  async getAllPodcastsLight(): Promise<Podcast[]> {
    const cacheKey = 'all-podcasts-light'
    const cached = this.getCache(cacheKey)
    if (cached) return cached as Podcast[]

    try {
      console.log('Fetching podcast directories...')
      const { data, error } = await supabaseStorage.storage
        .from('transcripts')
        .list('', {
          limit: 1000,
          offset: 0,
        })

      if (error) throw error

      // Get all podcast directories
      const podcastDirs = data?.filter((item: StorageFileObject) => item.name && !item.name.includes('.')) || []
      console.log(`Found ${podcastDirs.length} podcast directories`)
      
      // Fetch episode counts in parallel for better performance
      const podcastPromises = podcastDirs.map(async (dir: StorageFileObject) => {
        try {
          const { data: episodeFiles, error: episodeError } = await supabaseStorage.storage
            .from('transcripts')
            .list(dir.name, {
              limit: 1000,
              offset: 0,
            })

          if (episodeError) {
            console.error(`Error fetching episodes for ${dir.name}:`, episodeError)
            return null
          }

          const markdownFiles = episodeFiles?.filter((file: StorageFileObject) => file.name.endsWith('.md')) || []
          
          // Create podcast without processing individual episodes
          return {
            name: dir.name.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            slug: this.createSlug(dir.name),
            episodes: [], // Empty for light version
            episodeCount: markdownFiles.length,
            description: `Browse ${markdownFiles.length} episode transcripts from ${dir.name.replace(/-/g, ' ')}`,
            latestEpisode: new Date() // Use current date as placeholder
          }
        } catch (error) {
          console.error(`Error processing ${dir.name}:`, error)
          return null
        }
      })

      const results = await Promise.all(podcastPromises)
      const validPodcasts = results.filter(p => p !== null) as Podcast[]
      
      console.log(`Successfully processed ${validPodcasts.length} podcasts`)
      this.setCache(cacheKey, validPodcasts)
      return validPodcasts
    } catch (error) {
      console.error('Error getting podcasts (light):', error)
      return []
    }
  }

  async getAllPodcasts(): Promise<Podcast[]> {
    const cacheKey = 'all-podcasts'
    const cached = this.getCache(cacheKey)
    if (cached) return cached as Podcast[]

    try {
      const files = await this.getAllFiles()
      const podcastMap = new Map<string, PodcastEpisode[]>()

      for (const file of files) {
        const [podcastName, episodeFileName] = file.split('/')
        const podcastSlug = this.createSlug(podcastName)
        const episodeSlug = this.createSlug(episodeFileName.replace('.md', ''))

        const episode = await this.getEpisode(podcastSlug, episodeSlug)
        if (episode) {
          if (!podcastMap.has(podcastSlug)) {
            podcastMap.set(podcastSlug, [])
          }
          podcastMap.get(podcastSlug)!.push(episode)
        }
      }

      const validPodcasts: Podcast[] = Array.from(podcastMap.entries()).map(([slug, episodes]) => {
        const sortedEpisodes = episodes.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        
        return {
          name: episodes[0]?.podcastName || slug,
          slug,
          episodes: sortedEpisodes,
          episodeCount: episodes.length,
          latestEpisode: sortedEpisodes[0]?.publishedAt,
          description: `Podcast transcripts for ${episodes[0]?.podcastName || slug}`
        }
      })

      this.setCache(cacheKey, validPodcasts)
      return validPodcasts
    } catch (error) {
      console.error('Error getting all podcasts:', error)
      return []
    }
  }

  async getPodcast(podcastSlug: string): Promise<Podcast | null> {
    const cacheKey = `podcast-${podcastSlug}`
    const cached = this.getCache(cacheKey)
    if (cached) return cached as Podcast

    try {
      // First try the light approach - just get the podcast metadata
      const lightPodcasts = await this.getAllPodcastsLight()
      const lightPodcast = lightPodcasts.find(p => p.slug === podcastSlug)
      
      if (!lightPodcast) {
        return null
      }

      // Get episode list without downloading content - much faster!
      try {
        // Get the original directory name from the storage
        const originalDirName = lightPodcast.name
          .replace(/\s+/g, '-')
          .replace(/Podcast/g, 'podcast')
          .replace(/With/g, 'with')
          .replace(/Leaders/g, 'Leaders') // Keep exact case for this one
        
        // Try different variations to match the actual directory name
        const possibleDirNames = [
          originalDirName,
          lightPodcast.name.replace(/\s+/g, '-'),
          'Empowering-Leaders-podcast-with-Luke-Darcy', // Known from debug logs
          'courtside-with-rachel-demita',
          'not-an-overnight-success', 
          'straight-talk-with-mark-bouris'
        ]
        
        let episodeData: StorageFileObject[] | null = null
        let actualDirName = ''
        
        // Try each possible directory name
        for (const dirName of possibleDirNames) {
          const slugMatch = this.createSlug(dirName) === podcastSlug
          if (slugMatch) {
            const { data, error } = await supabaseStorage.storage
              .from('transcripts')
              .list(dirName, {
                limit: 1000,
                offset: 0,
              })
            
            if (!error && data && data.length > 0) {
              episodeData = data
              actualDirName = dirName
              break
            }
          }
        }

        if (!episodeData) {
          console.error(`Could not find episodes for ${podcastSlug}`)
          throw new Error(`No episodes found for ${podcastSlug}`)
        }

        const markdownFiles = episodeData.filter((file: StorageFileObject) => file.name.endsWith('.md'))
        
        // Create lightweight episodes - NO content downloading!
        const episodes: PodcastEpisode[] = []
        const seenEpisodeSlugs = new Set<string>() // Track unique episode slugs
        
        markdownFiles.forEach((file: StorageFileObject) => {
          const episodeTitle = file.name.replace('.md', '')
          const episodeSlug = this.createSlug(episodeTitle)
          
          // Skip if we've already processed this episode slug
          if (seenEpisodeSlugs.has(episodeSlug)) {
            console.warn(`Duplicate episode slug detected in fast loading: ${episodeSlug} from file: ${actualDirName}/${file.name}`)
            return
          }
          
          seenEpisodeSlugs.add(episodeSlug)
          
          episodes.push({
            id: `${podcastSlug}-${episodeSlug}`,
            title: episodeTitle,
            podcastName: lightPodcast.name,
            slug: episodeSlug,
            podcastSlug,
            content: '', // Empty - will load on-demand when episode is clicked
            rawContent: '',
            timestamps: [], // Empty - will load on-demand
            duration: undefined,
            publishedAt: file.updated_at ? new Date(file.updated_at) : new Date(),
            description: `Episode transcript for ${episodeTitle}`, // Generic description
            keywords: [],
            filePath: `${actualDirName}/${file.name}`
          })
        })

        // Sort by filename/title (approximate chronological order)
        const sortedEpisodes = episodes.sort((a, b) => {
          // Try to extract episode numbers if they exist
          const aNum = a.title.match(/^\d+/)?.[0]
          const bNum = b.title.match(/^\d+/)?.[0]
          
          if (aNum && bNum) {
            return parseInt(bNum) - parseInt(aNum) // Newest first
          }
          
          // Fall back to date
          return b.publishedAt.getTime() - a.publishedAt.getTime()
        })
        
        const podcast: Podcast = {
          name: lightPodcast.name,
          slug: podcastSlug,
          episodes: sortedEpisodes,
          episodeCount: sortedEpisodes.length,
          latestEpisode: sortedEpisodes[0]?.publishedAt || lightPodcast.latestEpisode,
          description: lightPodcast.description
        }

        this.setCache(cacheKey, podcast)
        return podcast
      } catch (error) {
        console.error(`Error loading episodes for ${podcastSlug}:`, error)
        
        // Fall back to just the light podcast data without episodes
        const fallbackPodcast: Podcast = {
          ...lightPodcast,
          episodes: []
        }
        
        this.setCache(cacheKey, fallbackPodcast)
        return fallbackPodcast
      }
    } catch (error) {
      console.error(`Error getting podcast ${podcastSlug}:`, error)
      return null
    }
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