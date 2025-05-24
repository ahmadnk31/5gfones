#!/usr/bin/env node

/**
 * SEO Testing Script
 * Tests basic SEO implementation for 5GPhones
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 5GPhones SEO Implementation Test\n');

// Test 1: Check if SEO files exist
console.log('1. Checking SEO file structure...');
const seoFiles = [
  'src/lib/seo.ts',
  'src/lib/seo-utils.ts',
  'src/hooks/use-seo.ts',
  'src/components/seo/product-structured-data.tsx',
  'src/components/seo/organization-structured-data.tsx',
  'src/components/seo/breadcrumb-structured-data.tsx',
  'src/components/seo/seo-debugger.tsx',
  'src/app/sitemap.xml/route.ts',
  'src/app/robots.ts',
  'public/manifest.json'
];

let filesExist = 0;
seoFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
    filesExist++;
  } else {
    console.log(`   ❌ ${file} - MISSING`);
  }
});

console.log(`   📊 ${filesExist}/${seoFiles.length} SEO files found\n`);

// Test 2: Check if SEO translations exist
console.log('2. Checking SEO translations...');
const translationFiles = ['messages/en.json', 'messages/nl.json'];
let translationsValid = 0;

translationFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const json = JSON.parse(content);
    if (json.seo) {
      console.log(`   ✅ ${file} - SEO section found`);
      translationsValid++;
    } else {
      console.log(`   ❌ ${file} - SEO section missing`);
    }
  } catch (error) {
    console.log(`   ❌ ${file} - Error reading file`);
  }
});

console.log(`   📊 ${translationsValid}/${translationFiles.length} translation files have SEO sections\n`);

// Test 3: Check Next.js config for SEO optimizations
console.log('3. Checking Next.js configuration...');
try {
  const nextConfig = fs.readFileSync('next.config.mjs', 'utf8');
  const hasHeaders = nextConfig.includes('async headers()');
  const hasRedirects = nextConfig.includes('async redirects()');
  const hasImageOptimization = nextConfig.includes('formats:');
  
  console.log(`   ${hasHeaders ? '✅' : '❌'} Security headers configured`);
  console.log(`   ${hasRedirects ? '✅' : '❌'} Redirects configured`);
  console.log(`   ${hasImageOptimization ? '✅' : '❌'} Image optimization configured`);
} catch (error) {
  console.log('   ❌ Error reading next.config.mjs');
}

console.log();

// Test 4: Check if pages have been updated
console.log('4. Checking updated pages...');
const updatedPages = [
  'src/app/[locale]/layout.tsx',
  'src/app/[locale]/page.tsx',
  'src/app/[locale]/products/page.tsx',
  'src/app/[locale]/products/[productId]/page.tsx',
  'src/app/[locale]/repair/page.tsx'
];

let pagesUpdated = 0;
updatedPages.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const hasGenerateMetadata = content.includes('generateMetadata');
    const hasSEOImport = content.includes('generateSEOMetadata') || content.includes('SEO');
    
    if (hasGenerateMetadata || hasSEOImport) {
      console.log(`   ✅ ${file} - SEO implemented`);
      pagesUpdated++;
    } else {
      console.log(`   ⚠️  ${file} - No SEO detected`);
    }
  } catch (error) {
    console.log(`   ❌ ${file} - Error reading file`);
  }
});

console.log(`   📊 ${pagesUpdated}/${updatedPages.length} pages have SEO implementation\n`);

// Test 5: Environment check
console.log('5. Checking environment configuration...');
try {
  const envExample = fs.readFileSync('env.example', 'utf8');
  const hasBaseUrl = envExample.includes('NEXT_PUBLIC_BASE_URL');
  
  console.log(`   ${hasBaseUrl ? '✅' : '❌'} Base URL configuration available`);
  
  if (fs.existsSync('.env.local')) {
    const envLocal = fs.readFileSync('.env.local', 'utf8');
    const hasLocalBaseUrl = envLocal.includes('NEXT_PUBLIC_BASE_URL');
    console.log(`   ${hasLocalBaseUrl ? '✅' : '⚠️ '} Local base URL ${hasLocalBaseUrl ? 'configured' : 'not set'}`);
  } else {
    console.log('   ⚠️  .env.local not found (create from env.example)');
  }
} catch (error) {
  console.log('   ❌ Error checking environment files');
}

console.log();

// Summary
console.log('📋 SEO Implementation Summary:');
console.log('=====================================');

const totalScore = filesExist + translationsValid + pagesUpdated;
const maxScore = seoFiles.length + translationFiles.length + updatedPages.length;
const percentage = Math.round((totalScore / maxScore) * 100);

console.log(`Overall Implementation: ${percentage}%`);

if (percentage >= 90) {
  console.log('🎉 Excellent! SEO implementation is nearly complete.');
} else if (percentage >= 70) {
  console.log('👍 Good progress! A few more items to complete.');
} else if (percentage >= 50) {
  console.log('⚠️  Partial implementation. More work needed.');
} else {
  console.log('❌ SEO implementation needs significant work.');
}

console.log('\n🚀 Next Steps:');
console.log('1. Run: npm run dev');
console.log('2. Visit: http://localhost:3000');
console.log('3. Click "SEO Debug" button (bottom-right)');
console.log('4. Test sitemap: http://localhost:3000/sitemap.xml');
console.log('5. Test robots: http://localhost:3000/robots.txt');
console.log('6. Review SEO-TESTING-GUIDE.md for comprehensive testing');

console.log('\n💡 Pro Tips:');
console.log('- Set NEXT_PUBLIC_BASE_URL in .env.local');
console.log('- Test with Google Rich Results Test');
console.log('- Run Lighthouse SEO audit');
console.log('- Validate structured data with Schema.org validator');
