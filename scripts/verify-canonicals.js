#!/usr/bin/env node

/**
 * Script to verify canonical URLs are properly set on blog pages
 * Usage: node scripts/verify-canonicals.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.podcast2transcript.com';

// Sample URLs to test
const TEST_URLS = [
  '/blog',
  '/blog/straight-talk-with-mark-bouris',
  '/blog/straight-talk-with-mark-bouris/183-scott-yung-on-running-for-parliament-why-hes-the-right-person-to-represent-bennelong'
];

function fetchPage(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const fullUrl = BASE_URL + url;
    const client = fullUrl.startsWith('https') ? https : http;
    
    client.get(fullUrl, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects > 0) {
          const redirectUrl = res.headers.location;
          // If it's a relative URL, make it absolute
          const finalUrl = redirectUrl.startsWith('http') ? redirectUrl : BASE_URL + redirectUrl;
          const newUrl = finalUrl.replace(BASE_URL, '');
          return fetchPage(newUrl, maxRedirects - 1).then(resolve).catch(reject);
        } else {
          return reject(new Error('Too many redirects'));
        }
      }
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function extractCanonicalUrl(html) {
  // Try multiple regex patterns to catch different attribute orders
  const patterns = [
    /<link\s+rel="canonical"\s+href="([^"]+)"/i,
    /<link\s+href="([^"]+)"\s+rel="canonical"/i,
    /<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i,
    /<link[^>]*href="([^"]+)"[^>]*rel="canonical"/i
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

async function verifyCanonicals() {
  console.log('🔍 Verifying canonical URLs...\n');
  
  for (const url of TEST_URLS) {
    try {
      console.log(`Testing: ${BASE_URL}${url}`);
      const html = await fetchPage(url);
      const canonical = extractCanonicalUrl(html);
      
      if (canonical) {
        const expectedCanonical = BASE_URL + url;
        // Also accept the non-www version as valid (common SEO practice)
        const nonWwwCanonical = expectedCanonical.replace('https://www.', 'https://');
        
        if (canonical === expectedCanonical || canonical === nonWwwCanonical) {
          console.log(`✅ Canonical URL correct: ${canonical}`);
        } else {
          console.log(`⚠️  Canonical URL mismatch:`);
          console.log(`   Expected: ${expectedCanonical} or ${nonWwwCanonical}`);
          console.log(`   Found:    ${canonical}`);
        }
      } else {
        console.log(`❌ No canonical URL found`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`❌ Error testing ${url}:`, error.message);
      console.log('');
    }
  }
}

if (require.main === module) {
  verifyCanonicals().catch(console.error);
}

module.exports = { verifyCanonicals }; 