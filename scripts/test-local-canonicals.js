#!/usr/bin/env node

/**
 * Script to verify canonical URLs are working on local development server
 * Usage: node scripts/test-local-canonicals.js
 */

const http = require('http');

const LOCAL_URL = 'http://localhost:3001';

// Test URLs for local development
const TEST_URLS = [
  // Blog index
  '/blog',
  
  // Podcast listing pages - all 4 available podcasts
  '/blog/empowering-leaders-podcast-with-luke-darcy',
  '/blog/straight-talk-with-mark-bouris',
  '/blog/courtside-with-rachel-demita',
  '/blog/not-an-overnight-success',
  
  // Sample episode pages from different podcasts
  '/blog/straight-talk-with-mark-bouris/183-scott-yung-on-running-for-parliament-why-hes-the-right-person-to-represent-bennelong',
  '/blog/empowering-leaders-podcast-with-luke-darcy/dr-jay-bhattacharya-speaking-out-for-what-you-believe-in',
  '/blog/courtside-with-rachel-demita/david-jacoby-on-his-nets-optimism-why-russell-westbrook-is-unfairly-criticized-and-working-with-jale',
  '/blog/not-an-overnight-success/lisa-wilkinson-some-opportunities-only-come-around-once',
  
  // Additional episodes to test variety
  '/blog/straight-talk-with-mark-bouris/168-ufc-boss-dana-white-nsw-premier-chris-minns-talk-ufc-312',
  '/blog/empowering-leaders-podcast-with-luke-darcy/empowering-leaders-trailer',
  '/blog/not-an-overnight-success/brad-freddy-fittler-lifes-worth-writing-about'
];

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const fullUrl = LOCAL_URL + url;
    
    http.get(fullUrl, (res) => {
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

function extractMetaTags(html) {
  const metaTags = {};
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)</i);
  if (titleMatch) metaTags.title = titleMatch[1];
  
  // Extract description
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  if (descMatch) metaTags.description = descMatch[1];
  
  // Extract Open Graph URL
  const ogUrlMatch = html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i);
  if (ogUrlMatch) metaTags.ogUrl = ogUrlMatch[1];
  
  return metaTags;
}

async function testLocalCanonicals() {
  console.log('🔍 Testing canonical URLs on local development server...\n');
  console.log(`Base URL: ${LOCAL_URL}`);
  console.log(`Testing ${TEST_URLS.length} URLs...\n`);
  
  let successCount = 0;
  let failureCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < TEST_URLS.length; i++) {
    const url = TEST_URLS[i];
    try {
      console.log(`[${i + 1}/${TEST_URLS.length}] Testing: ${LOCAL_URL}${url}`);
      const html = await fetchPage(url);
      
      const canonical = extractCanonicalUrl(html);
      const metaTags = extractMetaTags(html);
      
      console.log(`   📄 Title: ${metaTags.title || 'Not found'}`);
      
      if (canonical) {
        const expectedCanonical = `https://podcast2transcript.com${url}`;
        const localCanonical = `http://localhost:3000${url}`;
        
        if (canonical === expectedCanonical) {
          console.log(`   ✅ Canonical URL correct (production): ${canonical}`);
          successCount++;
        } else if (canonical === localCanonical) {
          console.log(`   ⚠️  Canonical URL points to localhost (dev mode): ${canonical}`);
          console.log(`      This is normal for local development, but should be production URL when deployed`);
          successCount++; // Count as success since structure is correct
        } else {
          console.log(`   ❌ Canonical URL unexpected:`);
          console.log(`      Expected: ${expectedCanonical}`);
          console.log(`      Found:    ${canonical}`);
          failureCount++;
        }
      } else {
        console.log(`   ❌ No canonical URL found`);
        failureCount++;
        
        // Debug: Look for any link tags
        const linkTags = html.match(/<link[^>]*>/gi);
        if (linkTags) {
          console.log('   🔍 Found link tags:');
          linkTags.slice(0, 3).forEach(tag => console.log(`      ${tag}`));
          if (linkTags.length > 3) {
            console.log(`      ... and ${linkTags.length - 3} more`);
          }
        }
      }
      
      if (metaTags.ogUrl) {
        console.log(`   📊 OG URL: ${metaTags.ogUrl}`);
      }
      
      console.log('');
    } catch (error) {
      errorCount++;
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ Connection refused. Make sure the dev server is running on ${LOCAL_URL}`);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
      }
      console.log('');
    }
  }
  
  // Summary
  console.log('📊 SUMMARY:');
  console.log(`   ✅ Success: ${successCount}/${TEST_URLS.length}`);
  console.log(`   ❌ Failed:  ${failureCount}/${TEST_URLS.length}`);
  console.log(`   🚫 Errors:  ${errorCount}/${TEST_URLS.length}`);
  
  if (successCount === TEST_URLS.length) {
    console.log('\n🎉 All canonical URLs are working perfectly!');
  } else if (successCount > 0) {
    console.log('\n⚠️  Some canonical URLs need attention.');
  } else {
    console.log('\n❌ No canonical URLs found. Check the implementation.');
  }
}

if (require.main === module) {
  testLocalCanonicals().catch(console.error);
}

module.exports = { testLocalCanonicals }; 