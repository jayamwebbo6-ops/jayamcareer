import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/mongoDb';
import Blog from '../../../../../models/Blog';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { saveFile, deleteFile } from '../../../../../lib/fileUpload';

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    
    // params is a promise in next 15+
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // Check if request is multipart/form-data or json
    const contentType = request.headers.get('content-type') || '';
    let dataToUpdate = {};
    let newImagePath = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      const title = formData.get('title');
      const slug = formData.get('slug');
      const category = formData.get('category');
      const excerpt = formData.get('excerpt');
      const content = formData.get('content');
      const date = formData.get('date');
      const author = formData.get('author');
      const imageString = formData.get('image');
      const imageFile = formData.get('imageFile');

      if (title) dataToUpdate.title = title;
      if (slug) dataToUpdate.slug = slug;
      if (category) dataToUpdate.category = category;
      if (excerpt) dataToUpdate.excerpt = excerpt;
      if (content) dataToUpdate.content = content;
      if (date) dataToUpdate.date = date;
      if (author) dataToUpdate.author = author;

      if (!dataToUpdate.slug && dataToUpdate.title) {
        dataToUpdate.slug = dataToUpdate.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }

      if (imageFile && imageFile.name) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(imageFile.type)) {
          return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 });
        }
        if (imageFile.size > 5 * 1024 * 1024) {
          return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
        }

        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(imageFile.name) || (imageFile.type === 'image/webp' ? '.webp' : '.png');
        const filename = `seo-${uniqueSuffix}${ext}`;
        
        await saveFile(buffer, 'uploads/blogs', filename);
        newImagePath = `/uploads/blogs/${filename}`;
        dataToUpdate.image = newImagePath;
      } else if (imageString) {
        dataToUpdate.image = imageString;
      }
    } else {
      dataToUpdate = await request.json();
      if (dataToUpdate.title && !dataToUpdate.slug) {
        dataToUpdate.slug = dataToUpdate.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
    }

    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Delete old image if a new one is uploaded and the old one was a local file
    if (newImagePath && existingBlog.image) {
      const baseUrl = process.env.BASE_URL || '';
      let oldImagePath = existingBlog.image;
      if (baseUrl && oldImagePath.startsWith(baseUrl)) {
        oldImagePath = oldImagePath.substring(baseUrl.length);
      }
      
      if (oldImagePath.startsWith('/uploads/blogs/')) {
        await deleteFile(oldImagePath);
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, dataToUpdate, { new: true });
    
    return NextResponse.json(updatedBlog);
  } catch (error) {
    console.error('Blog PUT Error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A blog with this slug already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    
    // params is a promise in next 15+
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Delete associated image
    if (existingBlog.image) {
      const baseUrl = process.env.BASE_URL || '';
      let imagePath = existingBlog.image;
      if (baseUrl && imagePath.startsWith(baseUrl)) {
        imagePath = imagePath.substring(baseUrl.length);
      }

      if (imagePath.startsWith('/uploads/blogs/')) {
        await deleteFile(imagePath);
      }
    }

    await Blog.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Blog DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
