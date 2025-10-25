#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files and directories to remove
const filesToRemove = [
  // Remove entire directories
  'app/(full-page)',
  'app/api',
  'app/(main)/_templates',
  'app/data/datalab',
  'styles/layout',
  
  // Keep layout components - they're needed for the app shell
  // 'layout/AppMenu.tsx' - KEEP (used by main pages)
  // 'layout/AppFooter.tsx' - KEEP (used by main pages)
  // 'layout/AppSidebar.tsx' - KEEP (used by main pages)
  // 'layout/AppTopbar.tsx' - KEEP (used by main pages)
  // 'layout/AppConfig.tsx' - KEEP (used by main pages)
  
  // Remove public assets
  'public/layout/images/themes',
  'public/layout/images/banner-primeblocks-dark.png',
  'public/layout/images/banner-primeblocks.png',
  'public/layout/images/logo-dark.svg',
  'public/layout/images/logo-white.svg',
  'public/layout/images/الشعار-06.png',
  'public/layout/images/الشعار-07.png',
  
  // Keep all themes - removing theme cleanup
];

function removeFileOrDir(filePath) {
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
      console.log(`✅ Removed directory: ${filePath}`);
    } else {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed file: ${filePath}`);
    }
  } else {
    console.log(`⚠️  File/directory not found: ${filePath}`);
  }
}

console.log('🧹 Starting cleanup of unused template files...\n');

filesToRemove.forEach(removeFileOrDir);

console.log('\n✨ Cleanup complete!');
console.log('\n📝 Next steps:');
console.log('1. Update your layout imports if you removed layout components');
console.log('2. Update package.json if you removed dependencies');
console.log('3. Test your application to ensure everything still works');
console.log('4. Remove this cleanup script when done');
