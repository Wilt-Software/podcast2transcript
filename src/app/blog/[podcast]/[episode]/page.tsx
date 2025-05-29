import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BlogService } from '@/lib/blog-service'
import { generateEpisodeMetaTags, generateEpisodeStructuredData, generateBreadcrumbs } from '@/lib/seo'
import TranscriptViewer from '@/components/blog/TranscriptViewer'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { formatDistanceToNow } from 'date-fns'

interface EpisodePageProps {
  params: Promise<{
    podcast: string
    episode: string
  }>
}

export async function generateMetadata({ params }: EpisodePageProps): Promise<Metadata> {
  const blogService = BlogService.getInstance()
  const resolvedParams = await params
  const episode = await blogService.getEpisode(resolvedParams.podcast, resolvedParams.episode)
  
  if (!episode) {
    return {
      title: 'Episode Not Found | Podcast2Transcript',
      description: 'The requested episode could not be found.'
    }
  }

  const metaTags = generateEpisodeMetaTags(episode)
  return {
    title: metaTags.title,
    description: metaTags.description,
    keywords: metaTags.keywords,
    openGraph: metaTags.openGraph,
    twitter: metaTags.twitter,
    robots: metaTags.robots
  }
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const blogService = BlogService.getInstance()
  const resolvedParams = await params
  const episode = await blogService.getEpisode(resolvedParams.podcast, resolvedParams.episode)

  if (!episode) {
    notFound()
  }

  const podcast = await blogService.getPodcast(resolvedParams.podcast)
  const structuredData = generateEpisodeStructuredData(episode)
  const breadcrumbs = generateBreadcrumbs(podcast || undefined, episode)

  // Get related episodes (other episodes from the same podcast)
  const relatedEpisodes = podcast?.episodes
    .filter(ep => ep.slug !== episode.slug)
    .slice(0, 3) || []

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={breadcrumbs} />
          
          {/* Header */}
          <div className="mb-8">
            <div className="glass-card rounded-xl p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <Link 
                    href={`/blog/${episode.podcastSlug}`}
                    className="text-indigo-600 hover:text-indigo-800 font-medium text-sm mb-2 inline-block"
                  >
                    ← Back to {episode.podcastName}
                  </Link>
                  <h1 className="text-3xl md:text-4xl font-bold text-glass-primary mb-4">
                    {episode.title}
                  </h1>
                  <p className="text-glass-secondary mb-4">
                    {episode.description}
                  </p>
                </div>
                <div className="ml-6 flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎙️</span>
                  </div>
                </div>
              </div>
              
              {/* Episode Meta */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-glass-muted border-t border-white/10 pt-6">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Published {formatDistanceToNow(episode.publishedAt, { addSuffix: true })}
                </span>
                {episode.duration && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Duration: {episode.duration}
                  </span>
                )}
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  {episode.timestamps.length} timestamps
                </span>
              </div>
            </div>
          </div>

          {/* Transcript */}
          <TranscriptViewer episode={episode} />

          {/* Related Episodes */}
          {relatedEpisodes.length > 0 && (
            <div className="mt-16">
              <div className="glass-card rounded-xl p-8">
                <h2 className="text-2xl font-bold text-glass-primary mb-6">
                  More from {episode.podcastName}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedEpisodes.map((relatedEpisode) => (
                    <Link
                      key={relatedEpisode.slug}
                      href={`/blog/${relatedEpisode.podcastSlug}/${relatedEpisode.slug}`}
                      className="block p-4 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <h3 className="font-semibold text-glass-primary mb-2 line-clamp-2">
                        {relatedEpisode.title}
                      </h3>
                      <p className="text-sm text-glass-muted">
                        {formatDistanceToNow(relatedEpisode.publishedAt, { addSuffix: true })}
                      </p>
                    </Link>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-white/10">
                  <Link
                    href={`/blog/${episode.podcastSlug}`}
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View all episodes from {episode.podcastName}
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-16">
            <div className="glass-card rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-glass-primary mb-4">
                Need your own podcast transcribed?
              </h2>
              <p className="text-glass-secondary mb-6">
                Get the same AI-powered transcription service used to create this transcript. 
                Fast, accurate, and affordable.
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
    </>
  )
} 