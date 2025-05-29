import { NextResponse } from 'next/server'
import { supabaseStorage } from '@/lib/supabase'

interface FileObject {
  name: string
  updated_at?: string
}

interface DuplicateInfo {
  slug: string
  title: string
  filename: string
}

interface DuplicateGroup {
  slug: string
  count: number
  files: string[]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const podcastDir = searchParams.get('dir') || 'Empowering-Leaders-podcast-with-Luke-Darcy'
    
    console.log('🔍 Checking for duplicates in:', podcastDir)
    
    const { data, error } = await supabaseStorage.storage
      .from('transcripts')
      .list(podcastDir, {
        limit: 1000,
        offset: 0,
      })

    if (error) throw error

    const markdownFiles = data?.filter((file: FileObject) => file.name.endsWith('.md')) || []
    
    // Create slug function (same as in blog service)
    const createSlug = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    }
    
    const slugCounts = new Map<string, string[]>()
    const seenSlugs = new Set<string>()
    const duplicates: DuplicateInfo[] = []
    
    markdownFiles.forEach((file: FileObject) => {
      const episodeTitle = file.name.replace('.md', '')
      const episodeSlug = createSlug(episodeTitle)
      
      if (!slugCounts.has(episodeSlug)) {
        slugCounts.set(episodeSlug, [])
      }
      slugCounts.get(episodeSlug)!.push(file.name)
      
      if (seenSlugs.has(episodeSlug)) {
        duplicates.push({
          slug: episodeSlug,
          title: episodeTitle,
          filename: file.name
        })
      }
      seenSlugs.add(episodeSlug)
    })
    
    const duplicateGroups: DuplicateGroup[] = Array.from(slugCounts.entries())
      .filter(([, files]) => files.length > 1)
      .map(([slug, files]) => ({
        slug,
        count: files.length,
        files
      }))
    
    return NextResponse.json({
      success: true,
      podcastDir,
      totalFiles: markdownFiles.length,
      uniqueSlugs: seenSlugs.size,
      duplicateCount: duplicates.length,
      duplicateGroups,
      sampleDuplicates: duplicates.slice(0, 5)
    })

  } catch (error) {
    console.error('❌ Duplicate check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check duplicates',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 