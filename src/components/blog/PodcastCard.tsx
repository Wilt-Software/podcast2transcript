import Link from 'next/link'
import { Podcast } from '@/types/blog'
import { formatDistanceToNow } from 'date-fns'

interface PodcastCardProps {
  podcast: Podcast
}

export default function PodcastCard({ podcast }: PodcastCardProps) {
  return (
    <div className="glass-card rounded-xl p-6 hover:bg-white/15 transition-all duration-300">
      <Link href={`/blog/${podcast.slug}`} className="block">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-glass-primary mb-2 hover:text-indigo-600 transition-colors">
              {podcast.name}
            </h3>
            <p className="text-glass-secondary text-sm mb-3 line-clamp-2">
              {podcast.description}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎙️</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-glass-muted">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              {podcast.episodeCount} episodes
            </span>
            {podcast.latestEpisode && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Updated {formatDistanceToNow(podcast.latestEpisode, { addSuffix: true })}
              </span>
            )}
          </div>
          <div className="flex items-center text-indigo-600">
            <span className="mr-1">View episodes</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  )
} 