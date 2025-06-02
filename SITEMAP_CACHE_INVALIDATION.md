# Automatic Sitemap Cache Invalidation

This system automatically invalidates sitemap and blog caches when new transcripts are added to the Supabase database, ensuring that new content appears in sitemaps immediately.

## 🎯 Overview

When new transcripts are added to your Supabase database, the system automatically:
1. ✅ Invalidates the sitemap URL cache
2. ✅ Clears relevant blog service caches  
3. ✅ Regenerates sitemaps in the background
4. ✅ Makes new transcripts discoverable by search engines

## 🚀 Methods to Add New Transcripts

### Method 1: API Endpoint (Recommended)

Use the REST API to add transcripts with automatic cache invalidation:

```bash
curl -X POST https://your-domain.com/api/transcripts/add \
  -H "Content-Type: application/json" \
  -d '{
    "podcastName": "My Awesome Podcast",
    "episodeTitle": "Episode 1: Getting Started",
    "filePath": "my-awesome-podcast/episode-1-getting-started.md",
    "markdownContent": "**00:00:00** — Welcome to the show..."
  }'
```

**Required fields:**
- `podcastName`: Name of the podcast
- `episodeTitle`: Title of the episode
- `filePath`: Path to the transcript file in Supabase Storage

**Optional fields:**
- `markdownContent`: Transcript content (if not provided, will be fetched from storage)

### Method 2: Programmatic Helper

Use the TypeScript helper for programmatic transcript addition:

```typescript
import { addTranscript } from '@/utils/add-transcript-helper'

const result = await addTranscript({
  podcastName: 'My Awesome Podcast',
  episodeTitle: 'Episode 1: Getting Started',
  filePath: 'my-awesome-podcast/episode-1-getting-started.md'
})

if (result.success) {
  console.log('✅ Transcript added!', result.data)
} else {
  console.error('❌ Error:', result.error)
}
```

### Method 3: Batch Addition

Add multiple transcripts at once:

```typescript
import { TranscriptHelper } from '@/utils/add-transcript-helper'

const helper = new TranscriptHelper()
const results = await helper.addTranscriptsBatch([
  {
    podcastName: 'My Podcast',
    episodeTitle: 'Episode 1',
    filePath: 'my-podcast/episode-1.md'
  },
  {
    podcastName: 'My Podcast', 
    episodeTitle: 'Episode 2',
    filePath: 'my-podcast/episode-2.md'
  }
])
```

## 🔄 Manual Cache Invalidation

### Option 1: Webhook Endpoint

Call the webhook directly:

```bash
# Manual invalidation
curl -X POST https://your-domain.com/api/webhooks/new-transcript

# With authentication (if WEBHOOK_SECRET is set)
curl -X POST https://your-domain.com/api/webhooks/new-transcript \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET"
```

### Option 2: Sitemap API with Invalidation Flag

```bash
curl "https://your-domain.com/api/sitemap?page=1&invalidate=true"
```

### Option 3: Programmatic Invalidation

```typescript
import { TranscriptHelper } from '@/utils/add-transcript-helper'

const helper = new TranscriptHelper()
await helper.invalidateCaches()
```

## 🔧 Environment Variables

Add these optional environment variables to your `.env.local`:

```env
# Optional: Webhook security
WEBHOOK_SECRET=your-secret-key-here

# Required: Site URL for cache invalidation
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 📊 Cache Behavior

### Sitemap Cache
- **Duration**: 30 minutes
- **Auto-invalidation**: ✅ Yes, when transcripts added
- **Background refresh**: ✅ Yes, automatically triggered

### Blog Service Cache  
- **Duration**: 1 hour (general), 24 hours (file content)
- **Auto-invalidation**: ✅ Yes, targeted cache clearing
- **Scope**: Clears relevant podcast and global caches

## 🐛 Troubleshooting

### Issue: New transcript not showing in sitemap

**Solution 1**: Check if transcript was added to database
```sql
SELECT * FROM episodes WHERE episode_title = 'Your Episode Title';
```

**Solution 2**: Manually invalidate cache
```bash
curl -X POST https://your-domain.com/api/webhooks/new-transcript
```

**Solution 3**: Check logs for errors
```bash
# Check your application logs for cache invalidation messages
```

### Issue: Cache invalidation not working

**Possible causes:**
1. `NEXT_PUBLIC_SITE_URL` not set correctly
2. Network issues preventing webhook calls
3. Invalid webhook secret

**Debug steps:**
1. Test the webhook endpoint directly
2. Check environment variables
3. Review application logs

## 🔍 Verification

After adding a transcript, verify it appears in:

1. **Main sitemap**: `https://your-domain.com/sitemap.xml`
2. **Sub-sitemaps**: `https://your-domain.com/sitemap-1.xml` (etc.)
3. **Blog pages**: `https://your-domain.com/blog/podcast-slug/episode-slug`

## 🎛️ Advanced Usage

### Custom Webhook Integration

If you have external systems adding transcripts, call the webhook:

```javascript
// In your external system
fetch('https://your-domain.com/api/webhooks/new-transcript', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_WEBHOOK_SECRET'
  },
  body: JSON.stringify({
    action: 'new_transcript_added',
    transcript: {
      podcastName: 'Podcast Name',
      episodeTitle: 'Episode Title',
      podcastSlug: 'podcast-slug'
    }
  })
})
```

### Scheduled Cache Refresh

Set up a cron job for regular cache invalidation:

```bash
# Every 30 minutes
0,30 * * * * curl -X POST https://your-domain.com/api/webhooks/new-transcript
```

## 📈 Performance Impact

- **Cache invalidation**: ~50ms
- **Background refresh**: ~2-5 seconds (doesn't block requests)
- **Memory usage**: Minimal (cache cleared, not duplicated)
- **Database impact**: None (only affects in-memory caches)

## 🚦 Status Endpoints

Monitor the system:

```bash
# Test transcript addition API
curl https://your-domain.com/api/transcripts/add

# Test webhook
curl https://your-domain.com/api/webhooks/new-transcript

# Check sitemap generation
curl "https://your-domain.com/api/sitemap?page=1"
```

---

🎉 **That's it!** Your sitemaps will now automatically update when you add new transcripts to your Supabase database. 