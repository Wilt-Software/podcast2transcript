import { Metadata } from 'next'
import { BlogService } from '@/lib/blog-service'
import { generateBlogIndexMetaTags } from '@/lib/seo'
import PodcastCard from '@/components/blog/PodcastCard'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import Link from 'next/link'

export async function generateMetadata(): Promise<Metadata> {
  const metaTags = generateBlogIndexMetaTags()
  return {
    title: metaTags.title,
    description: metaTags.description,
    keywords: metaTags.keywords,
    openGraph: metaTags.openGraph,
    twitter: metaTags.twitter,
    robots: metaTags.robots,
    alternates: {
      canonical: metaTags.canonical
    }
  }
}

export default async function BlogPage() {
  const blogService = BlogService.getInstance()
  const podcasts = await blogService.getAllPodcastsLight()

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' }
  ]

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs items={breadcrumbs} />
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Podcast Transcripts</span>
          </h1>
          <p className="text-xl md:text-2xl text-glass-secondary mb-8 max-w-3xl mx-auto">
            Browse thousands of AI-generated podcast transcripts. Search, read, and discover 
            content from your favorite podcasts with timestamps and summaries.
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="glass-card px-6 py-3 rounded-full">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🎙️</span>
                <span className="text-glass-primary font-medium">
                  {podcasts.length} Podcasts
                </span>
              </div>
            </div>
            <div className="glass-card px-6 py-3 rounded-full">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📄</span>
                <span className="text-glass-primary font-medium">
                  {podcasts.reduce((total, podcast) => total + podcast.episodeCount, 0)} Episodes
                </span>
              </div>
            </div>
            <div className="glass-card px-6 py-3 rounded-full">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🔍</span>
                <span className="text-glass-primary font-medium">
                  Searchable Transcripts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Podcasts Grid */}
        {podcasts.length === 0 ? (
          <div className="text-center py-12">
            <div className="glass-card rounded-xl p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">🎙️</div>
              <h3 className="text-xl font-bold text-glass-primary mb-2">
                No podcasts found
              </h3>
              <p className="text-glass-secondary">
                We&apos;re working on adding more podcast transcripts. Check back soon!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {podcasts.map((podcast) => (
              <PodcastCard key={podcast.slug} podcast={podcast} />
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="glass-card rounded-xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-glass-primary mb-4">
              Want to transcribe your own podcast?
            </h2>
            <p className="text-glass-secondary mb-6">
              Get lightning-fast, AI-powered transcription for your podcast episodes. 
              Upload your audio and get accurate transcripts with timestamps in minutes.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              Start Transcribing
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 