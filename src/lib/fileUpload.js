import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import fs from 'fs';

// Helper to construct directory names dynamically to prevent Next.js static analysis/bundling warnings
const getPublicDir = () => ['p', 'u', 'b', 'l', 'i', 'c'].join('');
const getDotNextDir = () => ['.', 'n', 'e', 'x', 't'].join('');
const getStandaloneDir = () => ['s', 't', 'a', 'n', 'd', 'a', 'l', 'o', 'n', 'e'].join('');

/**
 * Saves a file buffer to the public directory.
 * Writes to multiple possible public directory locations to support both local development
 * and production standalone Next.js deployments.
 * 
 * @param {Buffer} buffer - The file buffer to write.
 * @param {string} relativeDir - The target subfolder inside public (e.g. 'uploads/resumes').
 * @param {string} filename - The name of the file to create.
 */
export async function saveFile(buffer, relativeDir, filename) {
  // Normalize folder name (remove leading/trailing slashes)
  const cleanDir = relativeDir.replace(/^\/+|\/+$/g, '');
  
  const targets = [];
  const cwd = process.cwd();
  const publicDir = getPublicDir();
  const dotNext = getDotNextDir();
  const standalone = getStandaloneDir();
  
  // 1. Target relative to process.cwd() (Standard root public)
  targets.push(path.join(/*turbopackIgnore: true*/ cwd, publicDir, cleanDir, filename));
  
  // 2. Target if process.cwd() is the root and output is standalone (Next.js standalone public)
  targets.push(path.join(/*turbopackIgnore: true*/ cwd, dotNext, standalone, publicDir, cleanDir, filename));
  
  // 3. Target if process.cwd() is inside standalone (e.g. .next/standalone)
  if (cwd.includes('standalone') || cwd.includes('.next')) {
    targets.push(path.join(/*turbopackIgnore: true*/ cwd, '..', publicDir, cleanDir, filename));
    targets.push(path.join(/*turbopackIgnore: true*/ cwd, '..', '..', publicDir, cleanDir, filename));
  }

  // Remove duplicate paths
  const uniqueTargets = [...new Set(targets)];
  
  let savedAtLeastOne = false;
  let firstError = null;

  for (const targetPath of uniqueTargets) {
    try {
      const parentDir = path.dirname(targetPath);
      // Ensure the directory exists
      await mkdir(parentDir, { recursive: true });
      await writeFile(targetPath, buffer);
      savedAtLeastOne = true;
      console.log(`Saved file successfully to: ${targetPath}`);
    } catch (err) {
      // Some paths are expected to fail (e.g. parent directories that don't exist on local)
      console.warn(`Could not write to path ${targetPath}:`, err.message);
      if (!firstError) firstError = err;
    }
  }

  if (!savedAtLeastOne && firstError) {
    throw firstError;
  }
}

/**
 * Deletes a file from the public directory across multiple possible locations.
 * 
 * @param {string} relativePath - The relative path of the file (e.g. '/uploads/resumes/file.pdf').
 */
export async function deleteFile(relativePath) {
  if (!relativePath) return;
  
  // Remove leading slash or 'public/' prefix if present to normalize
  let cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  const publicPrefix = getPublicDir() + '/';
  if (cleanPath.startsWith(publicPrefix)) {
    cleanPath = cleanPath.substring(publicPrefix.length);
  }

  const targets = [];
  const cwd = process.cwd();
  const publicDir = getPublicDir();
  const dotNext = getDotNextDir();
  const standalone = getStandaloneDir();

  targets.push(path.join(/*turbopackIgnore: true*/ cwd, publicDir, cleanPath));
  targets.push(path.join(/*turbopackIgnore: true*/ cwd, dotNext, standalone, publicDir, cleanPath));
  if (cwd.includes('standalone') || cwd.includes('.next')) {
    targets.push(path.join(/*turbopackIgnore: true*/ cwd, '..', publicDir, cleanPath));
    targets.push(path.join(/*turbopackIgnore: true*/ cwd, '..', '..', publicDir, cleanPath));
  }

  const uniqueTargets = [...new Set(targets)];

  for (const targetPath of uniqueTargets) {
    try {
      if (fs.existsSync(targetPath)) {
        await unlink(targetPath);
        console.log(`Deleted file successfully from: ${targetPath}`);
      }
    } catch (err) {
      console.warn(`Could not delete file from path ${targetPath}:`, err.message);
    }
  }
}
