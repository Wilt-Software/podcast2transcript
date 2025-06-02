// Sitemap cache management utilities
import { SitemapUrl } from './sitemap-utils'

// Cache for sitemap URLs to avoid regenerating them for each page
let urlsCache: SitemapUrl[] | null = null
let cacheTimestamp: number = 0

// Helper function to reset cache (can be called programmatically)
export function resetSitemapCache() {
  urlsCache = null
  cacheTimestamp = 0
  console.log('♻️ Sitemap cache reset programmatically')
}

// Helper function to get cache state
export function getSitemapCache() {
  return { urlsCache, cacheTimestamp }
}

// Helper function to set cache
export function setSitemapCache(urls: SitemapUrl[], timestamp: number) {
  urlsCache = urls
  cacheTimestamp = timestamp
} 