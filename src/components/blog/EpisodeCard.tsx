import Link from 'next/link'
import { PodcastEpisode } from '@/types/blog'
import { formatDistanceToNow } from 'date-fns'

interface EpisodeCardProps {
  episode: PodcastEpisode
}

export default function EpisodeCard({ episode }: EpisodeCardProps) {
  return (
    <div className="glass-card rounded-xl p-6 hover:bg-white/15 transition-all duration-300">
      <Link href={`/blog/${episode.podcastSlug}/${episode.slug}`} className="block">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-glass-primary mb-2 hover:text-indigo-600 transition-colors line-clamp-2">
            {episode.title}
          </h3>
          {/* Removed preview text for faster loading */}
        </div>
        
        <div className="flex items-center justify-between text-sm text-glass-muted">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {formatDistanceToNow(episode.publishedAt, { addSuffix: true })}
            </span>
            {episode.duration && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                {episode.duration}
              </span>
            )}
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              Episode Transcript
            </span>
          </div>
          <div className="flex items-center text-indigo-600">
            <span className="mr-1">Read transcript</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  )
} 