import { NextRequest, NextResponse } from 'next/server'
import { TranscriptService } from '@/lib/transcript-service'
import { supabaseStorage } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      podcastName,
      episodeTitle,
      filePath,
      markdownContent
    } = body

    if (!podcastName || !episodeTitle || !filePath) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: podcastName, episodeTitle, filePath' },
        { status: 400 }
      )
    }

    const transcriptService = TranscriptService.getInstance()

    // Generate slugs
    const podcastSlug = transcriptService.createPodcastSlug(podcastName)
    const episodeSlug = transcriptService.createSlug(episodeTitle)

    // Check if transcript already exists
    const exists = await transcriptService.transcriptExists(podcastSlug, episodeSlug)
    if (exists) {
      return NextResponse.json(
        { success: false, error: 'Transcript already exists for this episode' },
        { status: 409 }
      )
    }

    // Extract metadata if markdown content provided
    let metadata = {
      contentPreview: '',
      wordCount: 0,
      durationEstimate: 0
    }

    if (markdownContent) {
      metadata = transcriptService.extractMetadataFromContent(markdownContent)
    } else {
      // Try to fetch content from storage to extract metadata
      try {
        const { data, error } = await supabaseStorage.storage
          .from('transcripts')
          .download(filePath)
        
        if (!error && data) {
          const content = await data.text()
          metadata = transcriptService.extractMetadataFromContent(content)
        }
      } catch (error) {
        console.warn('Could not fetch file content for metadata extraction:', error)
      }
    }

    // Get file size
    let fileSize = 0
    try {
      const { data: fileInfo } = await supabaseStorage.storage
        .from('transcripts')
        .list(filePath.substring(0, filePath.lastIndexOf('/')), {
          search: filePath.substring(filePath.lastIndexOf('/') + 1)
        })
      
      if (fileInfo && fileInfo.length > 0) {
        fileSize = fileInfo[0].metadata?.size || 0
      }
    } catch (error) {
      console.warn('Could not get file size:', error)
    }

    // Add transcript to database
    const result = await transcriptService.addNewTranscript({
      podcastName,
      episodeTitle,
      filePath,
      slug: episodeSlug,
      podcastSlug,
      fileSize,
      contentPreview: metadata.contentPreview,
      wordCount: metadata.wordCount,
      durationEstimate: metadata.durationEstimate
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    console.log(`✅ Successfully added transcript: ${episodeTitle}`)

    return NextResponse.json({
      success: true,
      message: 'Transcript added successfully and sitemap cache invalidated',
      data: {
        id: result.id,
        podcastSlug,
        episodeSlug,
        filePath,
        metadata
      }
    })

  } catch (error) {
    console.error('❌ Error in add transcript API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Add Transcript API',
    usage: 'POST /api/transcripts/add',
    requiredFields: ['podcastName', 'episodeTitle', 'filePath'],
    optionalFields: ['markdownContent'],
    example: {
      podcastName: 'My Podcast',
      episodeTitle: 'Episode 1: Introduction',
      filePath: 'my-podcast/episode-1-introduction.md',
      markdownContent: '**00:00:00** — Welcome to the show...'
    }
  })
} 