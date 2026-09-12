import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongoDb';
import Blog from '../../../../models/Blog';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { saveFile } from '../../../../lib/fileUpload';

export async function GET(request) {
  try {
    await connectToDatabase();
    const blogs = await Blog.find({}).sort({ createdAt: -1 });
    return NextResponse.json(blogs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    
    // Parse FormData instead of JSON
    const formData = await request.formData();
    
    const title = formData.get('title');
    let slug = formData.get('slug');
    const category = formData.get('category');
    const excerpt = formData.get('excerpt');
    const content = formData.get('content');
    const date = formData.get('date');
    const author = formData.get('author');
    const imageString = formData.get('image');
    const imageFile = formData.get('imageFile');

    if (!title || !excerpt || !content || !date || !author || !category) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (!slug) {
      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    let finalImagePath = imageString || '/blogs/marketing.png';

    if (imageFile && imageFile.name) {
      // Validate file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(imageFile.type)) {
        return NextResponse.json({ error: 'Invalid file type. Only jpg, jpeg, png, webp are allowed.' }, { status: 400 });
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
      finalImagePath = `/uploads/blogs/${filename}`;
    }

    const data = {
      title,
      slug,
      category,
      excerpt,
      content,
      date,
      author,
      image: finalImagePath,
    };

    const newBlog = await Blog.create(data);
    return NextResponse.json(newBlog, { status: 201 });
  } catch (error) {
    console.error('Blog POST Error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A blog with this slug already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
