import { PodcastEpisode, Podcast, SitemapEntry } from '@/types/blog'

export function generateEpisodeStructuredData(episode: PodcastEpisode) {
  return {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: episode.title,
    description: episode.description,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com'}/blog/${episode.podcastSlug}/${episode.slug}`,
    datePublished: episode.publishedAt.toISOString(),
    duration: episode.duration,
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: episode.podcastName,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com'}/blog/${episode.podcastSlug}`
    },
    transcript: {
      '@type': 'MediaObject',
      contentUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com'}/blog/${episode.podcastSlug}/${episode.slug}`,
      encodingFormat: 'text/html'
    }
  }
}

export function generatePodcastStructuredData(podcast: Podcast) {
  return {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name: podcast.name,
    description: podcast.description,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com'}/blog/${podcast.slug}`,
    numberOfEpisodes: podcast.episodeCount,
    episode: podcast.episodes.slice(0, 10).map(episode => ({
      '@type': 'PodcastEpisode',
      name: episode.title,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com'}/blog/${episode.podcastSlug}/${episode.slug}`,
      datePublished: episode.publishedAt.toISOString()
    }))
  }
}

export function generateEpisodeMetaTags(episode: PodcastEpisode) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com'
  const episodeUrl = `${baseUrl}/blog/${episode.podcastSlug}/${episode.slug}`
  
  return {
    title: `${episode.title} - ${episode.podcastName} Transcript | Podcast2Transcript`,
    description: episode.description || `Read the full transcript of ${episode.title} from ${episode.podcastName}. AI-powered podcast transcription with timestamps.`,
    keywords: [
      episode.podcastName,
      episode.title,
      'podcast transcript',
      'podcast transcription',
      'AI transcription',
      ...(episode.keywords || [])
    ].join(', '),
    openGraph: {
      title: `${episode.title} - ${episode.podcastName} Transcript`,
      description: episode.description,
      url: episodeUrl,
      type: 'article',
      publishedTime: episode.publishedAt.toISOString(),
      authors: [episode.podcastName],
      section: 'Podcast Transcripts',
      tags: episode.keywords || []
    },
    twitter: {
      card: 'summary_large_image',
      title: `${episode.title} - ${episode.podcastName} Transcript`,
      description: episode.description,
      creator: '@podcast2transcript'
    },
    canonical: episodeUrl,
    robots: 'index, follow',
    alternates: {
      canonical: episodeUrl
    }
  }
}

export function generatePodcastMetaTags(podcast: Podcast) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com'
  const podcastUrl = `${baseUrl}/blog/${podcast.slug}`
  
  return {
    title: `${podcast.name} Transcripts | Podcast2Transcript`,
    description: `Browse all ${podcast.episodeCount} episode transcripts from ${podcast.name}. AI-powered podcast transcription with timestamps and summaries.`,
    keywords: [
      podcast.name,
      'podcast transcripts',
      'podcast transcription',
      'AI transcription',
      'episode transcripts'
    ].join(', '),
    openGraph: {
      title: `${podcast.name} Transcripts`,
      description: `Browse all episode transcripts from ${podcast.name}`,
      url: podcastUrl,
      type: 'website',
      siteName: 'Podcast2Transcript'
    },
    twitter: {
      card: 'summary',
      title: `${podcast.name} Transcripts`,
      description: `Browse all episode transcripts from ${podcast.name}`,
      creator: '@podcast2transcript'
    },
    canonical: podcastUrl,
    robots: 'index, follow'
  }
}

export function generateBlogIndexMetaTags() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com'
  const blogUrl = `${baseUrl}/blog`
  
  return {
    title: 'Podcast Transcripts Blog | Podcast2Transcript',
    description: 'Browse thousands of AI-generated podcast transcripts. Search, read, and discover content from your favorite podcasts with timestamps and summaries.',
    keywords: 'podcast transcripts, podcast transcription, AI transcription, podcast blog, episode transcripts',
    openGraph: {
      title: 'Podcast Transcripts Blog',
      description: 'Browse thousands of AI-generated podcast transcripts',
      url: blogUrl,
      type: 'website',
      siteName: 'Podcast2Transcript'
    },
    twitter: {
      card: 'summary',
      title: 'Podcast Transcripts Blog',
      description: 'Browse thousands of AI-generated podcast transcripts',
      creator: '@podcast2transcript'
    },
    canonical: blogUrl,
    robots: 'index, follow'
  }
}

export function generateSitemapEntries(podcasts: Podcast[]): SitemapEntry[] {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com'
  const entries: SitemapEntry[] = []

  // Blog index
  entries.push({
    url: `${baseUrl}/blog`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8
  })

  // Podcast pages
  podcasts.forEach(podcast => {
    entries.push({
      url: `${baseUrl}/blog/${podcast.slug}`,
      lastModified: podcast.latestEpisode || new Date(),
      changeFrequency: 'weekly',
      priority: 0.7
    })

    // Episode pages
    podcast.episodes.forEach(episode => {
      entries.push({
        url: `${baseUrl}/blog/${podcast.slug}/${episode.slug}`,
        lastModified: episode.publishedAt,
        changeFrequency: 'monthly',
        priority: 0.6
      })
    })
  })

  return entries
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function generateBreadcrumbs(podcast?: Podcast, episode?: PodcastEpisode) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com'
  const breadcrumbs = [
    { name: 'Home', url: baseUrl },
    { name: 'Blog', url: `${baseUrl}/blog` }
  ]

  if (podcast) {
    breadcrumbs.push({
      name: podcast.name,
      url: `${baseUrl}/blog/${podcast.slug}`
    })
  }

  if (episode) {
    breadcrumbs.push({
      name: episode.title,
      url: `${baseUrl}/blog/${episode.podcastSlug}/${episode.slug}`
    })
  }

  return breadcrumbs
} 