import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogService } from '@/lib/blog-service'
import { generatePodcastMetaTags, generatePodcastStructuredData, generateBreadcrumbs } from '@/lib/seo'
import EpisodeCard from '@/components/blog/EpisodeCard'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface PodcastPageProps {
  params: Promise<{
    podcast: string
  }>
}

export async function generateMetadata({ params }: PodcastPageProps): Promise<Metadata> {
  const blogService = BlogService.getInstance()
  const resolvedParams = await params
  const podcast = await blogService.getPodcast(resolvedParams.podcast)
  
  if (!podcast) {
    return {
      title: 'Podcast Not Found | Podcast2Transcript',
      description: 'The requested podcast could not be found.'
    }
  }

  const metaTags = generatePodcastMetaTags(podcast)
  return {
    title: metaTags.title,
    description: metaTags.description,
    keywords: metaTags.keywords,
    openGraph: metaTags.openGraph,
    twitter: metaTags.twitter,
    robots: metaTags.robots
  }
}

export default async function PodcastPage({ params }: PodcastPageProps) {
  const blogService = BlogService.getInstance()
  const resolvedParams = await params
  const podcast = await blogService.getPodcast(resolvedParams.podcast)

  if (!podcast) {
    notFound()
  }

  const structuredData = generatePodcastStructuredData(podcast)
  const breadcrumbs = generateBreadcrumbs(podcast)

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={breadcrumbs} />
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-4xl">🎙️</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">{podcast.name}</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-glass-secondary mb-8 max-w-3xl mx-auto">
              {podcast.description}
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="glass-card px-6 py-3 rounded-full">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📄</span>
                  <span className="text-glass-primary font-medium">
                    {podcast.episodeCount} Episodes
                  </span>
                </div>
              </div>
              {podcast.latestEpisode && (
                <div className="glass-card px-6 py-3 rounded-full">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🕒</span>
                    <span className="text-glass-primary font-medium">
                      Updated {formatDistanceToNow(podcast.latestEpisode, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              )}
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

          {/* Episodes Grid */}
          {podcast.episodes.length === 0 ? (
            <div className="text-center py-12">
              <div className="glass-card rounded-xl p-8 max-w-md mx-auto">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-bold text-glass-primary mb-2">
                  No episodes found
                </h3>
                <p className="text-glass-secondary">
                  We&apos;re working on adding more episodes for this podcast. Check back soon!
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-glass-primary mb-4">
                  All Episodes ({podcast.episodeCount})
                </h2>
                <p className="text-glass-secondary">
                  Browse all available episode transcripts for {podcast.name}. 
                  Each transcript includes timestamps and is fully searchable.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {podcast.episodes.map((episode) => (
                  <EpisodeCard key={episode.id} episode={episode} />
                ))}
              </div>
            </>
          )}

          {/* Internal Linking */}
          <div className="mt-16">
            <div className="glass-card rounded-xl p-8">
              <h2 className="text-2xl font-bold text-glass-primary mb-4">
                Explore More Podcasts
              </h2>
              <p className="text-glass-secondary mb-6">
                Discover transcripts from other podcasts in our growing collection.
              </p>
              <Link
                href="/blog"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                Browse All Podcasts
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 