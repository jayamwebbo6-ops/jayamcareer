import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to construct directory names dynamically to prevent Next.js static analysis/bundling warnings
const getPublicDir = () => ['p', 'u', 'b', 'l', 'i', 'c'].join('');
const getDotNextDir = () => ['.', 'n', 'e', 'x', 't'].join('');
const getStandaloneDir = () => ['s', 't', 'a', 'n', 'd', 'a', 'l', 'o', 'n', 'e'].join('');

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Dynamically extract path from /uploads/ onwards to support any basePath/subpath hosting robustly
    const uploadIndex = pathname.indexOf('/uploads/');
    let relativePath = pathname;
    if (uploadIndex !== -1) {
      relativePath = pathname.slice(uploadIndex);
    }
    
    // Strip leading slash
    if (relativePath.startsWith('/')) {
      relativePath = relativePath.slice(1);
    }

    // Now relativePath is like "uploads/resumes/resume-xxx.pdf" or "uploads/blogs/seo-xxx.png"

    // Security check: Prevent directory traversal (e.g. /uploads/../../.env.local)
    const pathParts = relativePath.split(/[/\\]/);
    if (pathParts.includes('..') || pathParts.includes('.')) {
      return new Response('Forbidden', { status: 403 });
    }

    const cwd = process.cwd();
    const publicDir = getPublicDir();
    const dotNext = getDotNextDir();
    const standalone = getStandaloneDir();

    const targets = [];
    targets.push(path.join(cwd, publicDir, relativePath));
    targets.push(path.join(cwd, dotNext, standalone, publicDir, relativePath));
    
    if (cwd.includes('standalone') || cwd.includes('.next')) {
      targets.push(path.join(cwd, '..', publicDir, relativePath));
      targets.push(path.join(cwd, '..', '..', publicDir, relativePath));
    }

    const uniqueTargets = [...new Set(targets)];
    let filePath = null;

    for (const targetPath of uniqueTargets) {
      if (fs.existsSync(targetPath)) {
        filePath = targetPath;
        break;
      }
    }

    if (!filePath) {
      return new Response('File not found', { status: 404 });
    }

    // Determine the content-type from file extension
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    } else if (ext === '.svg') {
      contentType = 'image/svg+xml';
    } else if (ext === '.doc') {
      contentType = 'application/msword';
    } else if (ext === '.docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (ext === '.xls') {
      contentType = 'application/vnd.ms-excel';
    } else if (ext === '.xlsx') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
