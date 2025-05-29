export interface PodcastEpisode {
  id: string
  title: string
  podcastName: string
  slug: string
  podcastSlug: string
  content: string
  rawContent: string
  timestamps: TimestampEntry[]
  duration?: string
  publishedAt: Date
  description?: string
  keywords?: string[]
  filePath: string
}

export interface TimestampEntry {
  timestamp: string
  text: string
  timeInSeconds: number
}

export interface Podcast {
  name: string
  slug: string
  episodes: PodcastEpisode[]
  episodeCount: number
  description?: string
  latestEpisode?: Date
}

export interface BlogMetadata {
  title: string
  description: string
  keywords: string[]
  publishedAt: string
  podcastName: string
  episodeTitle: string
}

export interface SitemapEntry {
  url: string
  lastModified: Date
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  priority: number
} 