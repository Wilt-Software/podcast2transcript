#!/usr/bin/env node

const https = require('https');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      
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

async function debug() {
  const html = await fetchPage('https://podcast2transcript.com/blog');
  
  console.log('HTML length:', html.length);
  console.log('First 500 characters:');
  console.log(html.substring(0, 500));
  
  // Look for any link tags with canonical
  const canonicalMatches = html.match(/<link[^>]*rel="canonical"[^>]*>/gi);
  console.log('Found canonical links:', canonicalMatches);
  
  // Look for the word canonical anywhere
  const canonicalIndex = html.indexOf('canonical');
  console.log('Found "canonical" at index:', canonicalIndex);
  
  if (canonicalIndex !== -1) {
    const start = Math.max(0, canonicalIndex - 100);
    const end = Math.min(html.length, canonicalIndex + 200);
    console.log('Context around canonical:');
    console.log(html.substring(start, end));
  }
}

debug().catch(console.error); 