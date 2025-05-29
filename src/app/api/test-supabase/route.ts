import { NextResponse } from 'next/server'
import { supabaseStorage } from '@/lib/supabase'

interface FileObject {
  name: string
  id?: string
  updated_at?: string
  created_at?: string
  last_accessed_at?: string
  metadata?: Record<string, unknown>
}

export async function GET() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data: buckets, error: bucketsError } = await supabaseStorage.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to list buckets',
        details: bucketsError
      })
    }

    console.log('Available buckets:', buckets)

    // Test transcripts bucket specifically
    const { data: files, error: filesError } = await supabaseStorage.storage
      .from('transcripts')
      .list('', {
        limit: 10,
        offset: 0
      })

    if (filesError) {
      console.error('Error listing files in transcripts bucket:', filesError)
      return NextResponse.json({
        success: false,
        error: 'Failed to list files in transcripts bucket',
        details: filesError,
        buckets: buckets
      })
    }

    console.log('Files in transcripts bucket:', files)

    // If we have folders, let's check one of them
    let sampleFiles: FileObject[] = []
    if (files && files.length > 0) {
      const firstFolder = files.find(item => !item.name.includes('.'))
      if (firstFolder) {
        const { data: folderFiles, error: folderError } = await supabaseStorage.storage
          .from('transcripts')
          .list(firstFolder.name, {
            limit: 5,
            offset: 0
          })
        
        if (!folderError && folderFiles) {
          sampleFiles = folderFiles.filter(file => file.name.endsWith('.md'))
        }
      }
    }

    return NextResponse.json({
      success: true,
      buckets: buckets,
      files: files,
      sampleFiles: sampleFiles,
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 