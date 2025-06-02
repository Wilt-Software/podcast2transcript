/**
 * Helper utility for adding transcripts programmatically
 * This automatically handles cache invalidation for sitemaps and blog service
 */

import { TranscriptService } from '@/lib/transcript-service'

interface AddTranscriptOptions {
  podcastName: string
  episodeTitle: string
  filePath: string
  markdownContent?: string
  skipDuplicateCheck?: boolean
}

export class TranscriptHelper {
  private transcriptService: TranscriptService

  constructor() {
    this.transcriptService = TranscriptService.getInstance()
  }

  /**
   * Add a new transcript with automatic cache invalidation
   */
  async addTranscript(options: AddTranscriptOptions): Promise<{
    success: boolean
    error?: string
    data?: {
      id: number
      podcastSlug: string
      episodeSlug: string
      filePath: string
    }
  }> {
    try {
      const { podcastName, episodeTitle, filePath, markdownContent, skipDuplicateCheck = false } = options

      console.log(`🎯 Adding transcript: ${episodeTitle}`)

      // Generate slugs
      const podcastSlug = this.transcriptService.createPodcastSlug(podcastName)
      const episodeSlug = this.transcriptService.createSlug(episodeTitle)

      // Check for duplicates unless skipped
      if (!skipDuplicateCheck) {
        const exists = await this.transcriptService.transcriptExists(podcastSlug, episodeSlug)
        if (exists) {
          return {
            success: false,
            error: `Transcript already exists for "${episodeTitle}" in "${podcastName}"`
          }
        }
      }

      // Extract metadata if content provided
      let metadata = {
        contentPreview: '',
        wordCount: 0,
        durationEstimate: 0
      }

      if (markdownContent) {
        metadata = this.transcriptService.extractMetadataFromContent(markdownContent)
      }

      // Add the transcript (this will automatically invalidate caches)
      const result = await this.transcriptService.addNewTranscript({
        podcastName,
        episodeTitle,
        filePath,
        slug: episodeSlug,
        podcastSlug,
        contentPreview: metadata.contentPreview,
        wordCount: metadata.wordCount,
        durationEstimate: metadata.durationEstimate
      })

      if (!result.success) {
        return { success: false, error: result.error }
      }

      console.log(`✅ Successfully added: ${episodeTitle}`)

      return {
        success: true,
        data: {
          id: result.id!,
          podcastSlug,
          episodeSlug,
          filePath
        }
      }

    } catch (error) {
      console.error('❌ Error in addTranscript:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Add multiple transcripts in batch
   */
  async addTranscriptsBatch(transcripts: AddTranscriptOptions[]): Promise<{
    success: boolean
    results: Array<{
      episodeTitle: string
      success: boolean
      error?: string
      data?: any
    }>
  }> {
    console.log(`🔄 Adding ${transcripts.length} transcripts in batch...`)

    const results = []

    for (const transcript of transcripts) {
      const result = await this.addTranscript(transcript)
      results.push({
        episodeTitle: transcript.episodeTitle,
        success: result.success,
        error: result.error,
        data: result.data
      })

      // Small delay between additions to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const successCount = results.filter(r => r.success).length
    console.log(`✅ Batch complete: ${successCount}/${transcripts.length} transcripts added successfully`)

    return {
      success: successCount > 0,
      results
    }
  }

  /**
   * Manually trigger cache invalidation
   */
  async invalidateCaches(): Promise<void> {
    console.log('🔄 Manually invalidating caches...')
    await this.transcriptService.invalidateSitemapCache()
  }
}

// Export a convenience function for quick use
export async function addTranscript(options: AddTranscriptOptions) {
  const helper = new TranscriptHelper()
  return helper.addTranscript(options)
}

// Example usage:
/*
import { addTranscript } from '@/utils/add-transcript-helper'

// Add a single transcript
const result = await addTranscript({
  podcastName: 'My Awesome Podcast',
  episodeTitle: 'Episode 1: Getting Started',
  filePath: 'my-awesome-podcast/episode-1-getting-started.md'
})

if (result.success) {
  console.log('Transcript added successfully!', result.data)
} else {
  console.error('Failed to add transcript:', result.error)
}
*/ 