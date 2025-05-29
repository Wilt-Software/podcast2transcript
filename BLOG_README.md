# Podcast2Transcript Blog System

## Overview
A comprehensive blog and SEO system for Podcast2Transcript that converts podcast transcripts stored in Supabase Storage into a searchable, SEO-optimized blog.

## Features

### 🎯 Core Features
- **Dynamic Routing**: `/blog/[podcast]/[episode]` structure
- **Podcast Listing**: `/blog` with all podcasts
- **Episode Pages**: Full transcript with timestamps
- **Search Functionality**: Search within transcripts
- **Responsive Design**: Mobile-first approach

### 🔍 SEO Optimization
- **Dynamic Meta Tags**: Episode-specific titles and descriptions
- **JSON-LD Structured Data**: PodcastSeries and PodcastEpisode schema
- **XML Sitemap**: Auto-generated for all blog pages
- **Breadcrumbs**: Navigation hierarchy
- **Internal Linking**: Between related episodes
- **Core Web Vitals**: Optimized for performance

### 📊 Content Management
- **Zero Database Changes**: Uses existing Supabase Storage
- **Markdown Processing**: Converts MD to HTML
- **Timestamp Parsing**: Extracts **HH:MM:SS** timestamps
- **Caching System**: 5-minute cache for performance
- **Keyword Extraction**: Auto-generated from content

## File Structure

```
src/
├── app/
│   ├── blog/
│   │   ├── page.tsx                    # Blog index
│   │   ├── [podcast]/
│   │   │   ├── page.tsx               # Podcast episodes list
│   │   │   └── [episode]/
│   │   │       └── page.tsx           # Episode transcript
│   │   ├── sitemap.ts                     # Dynamic sitemap
│   │   └── robots.ts                      # SEO robots.txt
│   ├── components/
│   │   ├── blog/
│   │   │   ├── PodcastCard.tsx           # Podcast preview card
│   │   │   ├── EpisodeCard.tsx           # Episode preview card
│   │   │   └── TranscriptViewer.tsx      # Transcript display
│   │   └── ui/
│   │       └── Breadcrumbs.tsx           # Navigation breadcrumbs
│   ├── lib/
│   │   ├── blog-service.ts               # Data fetching service
│   │   ├── seo.ts                        # SEO utilities
│   │   └── supabase.ts                   # Supabase client
│   └── types/
│       └── blog.ts                       # TypeScript interfaces
└── types/
    └── blog.ts                       # TypeScript interfaces
```

## Environment Variables

Create a `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://opbwoncafnrqcrhexxzw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://podcast2transcript.com
```

## Data Structure

### Supabase Storage
- **Bucket**: `transcripts`
- **Structure**: `podcast-name/episode-title.md`
- **Format**: Markdown with frontmatter and timestamped content

### Markdown Format
```markdown
---
title: "Episode Title"
description: "Episode description"
duration: "1:23:45"
publishedAt: "2024-01-01"
keywords: ["keyword1", "keyword2"]
---

**00:00:00** — Introduction to the episode...

**00:01:30** — First topic discussion...

**00:05:45** — Second topic...
```

## SEO Features

### Meta Tags
- Dynamic titles with episode and podcast names
- Descriptions from episode content
- Keywords extracted from transcripts
- Open Graph and Twitter Card support

### Structured Data
- PodcastSeries schema for podcast pages
- PodcastEpisode schema for episode pages
- Transcript metadata included

### Internal Linking
- Related episodes within same podcast
- Breadcrumb navigation
- Cross-linking between podcasts

## Performance

### Caching Strategy
- **BlogService**: 5-minute cache for all data
- **File Content**: Cached per file path
- **Podcast Lists**: Cached globally

### Optimization
- Server-side rendering for SEO
- Lazy loading for images
- Minimal JavaScript for core functionality

## Usage

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Access URLs
- Blog Index: `http://localhost:3000/blog`
- Podcast Page: `http://localhost:3000/blog/[podcast-slug]`
- Episode Page: `http://localhost:3000/blog/[podcast-slug]/[episode-slug]`
- Sitemap: `http://localhost:3000/sitemap.xml`

## Customization

### Adding New Features
1. Extend interfaces in `src/types/blog.ts`
2. Update `BlogService` for data processing
3. Add new components in `src/components/blog/`
4. Update SEO utilities in `src/lib/seo.ts`

### Styling
- Uses existing glassmorphism design system
- Tailwind CSS for responsive design
- Custom CSS classes in `globals.css`

## Deployment Considerations

1. **Environment Variables**: Set all required env vars
2. **Supabase Permissions**: Ensure read access to storage
3. **Domain Configuration**: Update NEXT_PUBLIC_SITE_URL
4. **CDN**: Consider caching for static assets

## Monitoring

### SEO Metrics
- Google Search Console for indexing
- Core Web Vitals monitoring
- Sitemap submission status

### Performance
- Page load times
- Cache hit rates
- Search functionality usage

## Future Enhancements

- [ ] Full-text search with Algolia/ElasticSearch
- [ ] Podcast RSS feed generation
- [ ] Audio player integration
- [ ] Comment system
- [ ] Social sharing buttons
- [ ] Analytics integration
- [ ] Content recommendations
- [ ] Multi-language support 