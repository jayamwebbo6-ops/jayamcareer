const fs = require('fs');
const path = require('path');

// Helper to recursively copy directories
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const rootDir = path.join(__dirname, '..');
const standaloneDir = path.join(rootDir, '.next/standalone');

const srcServer = path.join(standaloneDir, 'server.js');
const destServer = path.join(rootDir, 'server.js');

// 1. Copy server.js to root
if (fs.existsSync(srcServer)) {
  fs.copyFileSync(srcServer, destServer);
  console.log('✅ Successfully copied standalone server.js to the project root!');
} else {
  console.error('❌ Could not find standalone server.js.');
}

// 2. Copy public/ to .next/standalone/public/
const srcPublic = path.join(rootDir, 'public');
const destPublic = path.join(standaloneDir, 'public');
if (fs.existsSync(srcPublic)) {
  copyDirSync(srcPublic, destPublic);
  console.log('✅ Successfully copied public/ folder to .next/standalone/public/');
}

// 3. Copy .next/static/ to .next/standalone/.next/static/
const srcStatic = path.join(rootDir, '.next/static');
const destStatic = path.join(standaloneDir, '.next/static');
if (fs.existsSync(srcStatic)) {
  copyDirSync(srcStatic, destStatic);
  console.log('✅ Successfully copied .next/static/ folder to .next/standalone/.next/static/');
}
