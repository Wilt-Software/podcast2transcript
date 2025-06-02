import { supabaseAdmin, supabaseStorage } from './supabase'

interface NewTranscriptData {
  podcastName: string
  episodeTitle: string
  filePath: string
  slug: string
  podcastSlug: string
  fileSize?: number
  contentPreview?: string
  wordCount?: number
  durationEstimate?: number
}

export class TranscriptService {
  private static instance: TranscriptService

  static getInstance(): TranscriptService {
    if (!TranscriptService.instance) {
      TranscriptService.instance = new TranscriptService()
    }
    return TranscriptService.instance
  }

  /**
   * Add a new transcript to the database and automatically invalidate sitemap cache
   */
  async addNewTranscript(transcriptData: NewTranscriptData): Promise<{ success: boolean; error?: string; id?: number }> {
    try {
      console.log(`📝 Adding new transcript: ${transcriptData.episodeTitle}`)
      
      // Insert episode into database
      const { data, error } = await supabaseAdmin
        .from('episodes')
        .insert({
          podcast_name: transcriptData.podcastName,
          episode_title: transcriptData.episodeTitle,
          file_path: transcriptData.filePath,
          slug: transcriptData.slug,
          podcast_slug: transcriptData.podcastSlug,
          file_size: transcriptData.fileSize || 0,
          content_preview: transcriptData.contentPreview || null,
          word_count: transcriptData.wordCount || 0,
          duration_estimate: transcriptData.durationEstimate || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) {
        console.error('❌ Error adding transcript to database:', error)
        return { success: false, error: error.message }
      }

      console.log(`✅ Transcript added to database with ID: ${data.id}`)

      // Automatically invalidate sitemap cache
      await this.invalidateSitemapCache(transcriptData)

      return { success: true, id: data.id }

    } catch (error) {
      console.error('❌ Error in addNewTranscript:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Invalidate sitemap cache when new transcript is added
   */
  async invalidateSitemapCache(transcriptData?: NewTranscriptData): Promise<void> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com'
      
      console.log('🔄 Invalidating sitemap cache...')
      
      // Call our webhook endpoint to invalidate cache
      const response = await fetch(`${baseUrl}/api/webhooks/new-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.WEBHOOK_SECRET && {
            'Authorization': `Bearer ${process.env.WEBHOOK_SECRET}`
          })
        },
        body: JSON.stringify({
          action: 'new_transcript_added',
          transcript: transcriptData,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        console.log('✅ Sitemap cache invalidated successfully')
      } else {
        console.warn('⚠️ Failed to invalidate sitemap cache via webhook')
      }

    } catch (error) {
      console.error('❌ Error invalidating sitemap cache:', error)
      // Don't throw error - cache invalidation failure shouldn't break transcript addition
    }
  }

  /**
   * Create slug from text (matches the logic in blog-service.ts)
   */
  createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  /**
   * Generate podcast slug from podcast name
   */
  createPodcastSlug(podcastName: string): string {
    return this.createSlug(podcastName)
  }

  /**
   * Check if transcript already exists
   */
  async transcriptExists(podcastSlug: string, episodeSlug: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('episodes')
        .select('id')
        .eq('podcast_slug', podcastSlug)
        .eq('slug', episodeSlug)
        .limit(1)

      if (error) {
        console.error('Error checking transcript existence:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Error checking transcript existence:', error)
      return false
    }
  }

  /**
   * Extract metadata from markdown content
   */
  extractMetadataFromContent(markdownContent: string): {
    contentPreview: string
    wordCount: number
    durationEstimate: number
  } {
    // Remove timestamps and get preview
    const cleanContent = markdownContent.replace(/\*\*\d{1,2}:\d{2}:\d{2}\*\*\s*—\s*/g, '')
    const sentences = cleanContent.split(/[.!?]+/).slice(0, 3)
    const contentPreview = sentences.join('. ').substring(0, 160) + '...'
    
    // Count words (rough estimate)
    const wordCount = cleanContent.split(/\s+/).length
    
    // Estimate duration (assuming 150 words per minute average speaking speed)
    const durationEstimate = Math.round(wordCount / 150 * 60) // in seconds
    
    return {
      contentPreview,
      wordCount,
      durationEstimate
    }
  }
} 