#!/usr/bin/env node

/**
 * Script to verify canonical URLs are properly set on blog pages
 * Usage: node scripts/verify-canonicals.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcast2transcript.com';

// Sample URLs to test
const TEST_URLS = [
  '/blog',
  '/blog/straight-talk-with-mark-bouris',
  '/blog/straight-talk-with-mark-bouris/183-scott-yung-on-running-for-parliament-why-hes-the-right-person-to-represent-bennelong'
];

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const fullUrl = BASE_URL + url;
    const client = fullUrl.startsWith('https') ? https : http;
    
    client.get(fullUrl, (res) => {
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
  const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return canonicalMatch ? canonicalMatch[1] : null;
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
        if (canonical === expectedCanonical) {
          console.log(`✅ Canonical URL correct: ${canonical}`);
        } else {
          console.log(`⚠️  Canonical URL mismatch:`);
          console.log(`   Expected: ${expectedCanonical}`);
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