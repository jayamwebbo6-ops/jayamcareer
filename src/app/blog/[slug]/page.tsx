import Link from 'next/link';
import Image from 'next/image';
import { connectToDatabase } from '../../../lib/mongoDb';
import Blog from '../../../models/Blog';
import { notFound } from 'next/navigation';

const basePath = process.env.BASE_URL || '';

const getImageUrl = (imgStr: string) => {
  if (!imgStr) return '';
  if (imgStr.startsWith('data:') || imgStr.startsWith('blob:') || imgStr.startsWith('http')) return imgStr;
  if (imgStr.startsWith(basePath) && basePath !== '') return imgStr;
  return `${basePath}${imgStr.startsWith('/') ? '' : '/'}${imgStr}`;
};

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  await connectToDatabase();
  const resolvedParams = await params;
  const blog = await Blog.findOne({ slug: resolvedParams.slug }).lean();

  if (!blog) {
    notFound();
  }

  return (
    <div className="w-full flex flex-col items-center bg-white min-h-screen pb-24">
      {/* Hero Header */}
      <div className="w-full max-w-5xl px-6 sm:px-8 pt-16 md:pt-24 pb-12 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-[#ff6600] mb-6">
          <span>{blog.category}</span>
          <span className="w-1.5 h-1.5 bg-[#ff6600] rounded-full"></span>
          <span className="text-gray-400">{blog.date}</span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-4xl font-extrabold text-gray-900 mb-8 tracking-tight leading-[1.1]">
          {blog.title}
        </h1>

      
      </div>

      {/* Hero Image */}
      <div className="w-full max-w-6xl px-6 sm:px-8 mb-16">
        <div className="relative w-full h-[400px] md:h-[600px] rounded-[2rem] overflow-hidden shadow-2xl">
          <Image
            src={getImageUrl(blog.image)}
            alt={blog.title}
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-3xl px-6 sm:px-8 flex flex-col">
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-600 leading-relaxed mb-10 font-medium border-l-4 border-[#ff6600] pl-6 italic">
            {blog.excerpt}
          </p>

          <div className="text-gray-800 leading-loose space-y-6 text-lg whitespace-pre-line font-medium">
            {blog.content}
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-gray-100 flex items-center justify-between">
          <Link href="/blog">
            <button className="flex items-center gap-2 text-gray-500 hover:text-[#ff6600] font-bold transition-colors group">
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Blog
            </button>
          </Link>

          <div className="flex gap-4">
            <button className="w-10 h-10 rounded-full bg-gray-50 hover:bg-[#ff6600] hover:text-white flex items-center justify-center text-gray-400 transition-colors shadow-sm border border-gray-100 hover:border-[#ff6600]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
            </button>
            <button className="w-10 h-10 rounded-full bg-gray-50 hover:bg-[#ff6600] hover:text-white flex items-center justify-center text-gray-400 transition-colors shadow-sm border border-gray-100 hover:border-[#ff6600]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
