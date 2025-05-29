import Link from 'next/link'
import { PodcastEpisode } from '@/types/blog'

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
            {episode.duration && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                {episode.duration}
              </span>
            )}
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