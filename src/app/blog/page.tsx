import Link from 'next/link';
import Image from 'next/image';
import { connectToDatabase } from '../../lib/mongoDb';
import Blog from '../../models/Blog';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const basePath = process.env.BASE_URL || '';

const getImageUrl = (imgStr: string) => {
  if (!imgStr) return '';
  if (imgStr.startsWith('data:') || imgStr.startsWith('blob:') || imgStr.startsWith('http')) return imgStr;
  if (imgStr.startsWith(basePath) && basePath !== '') return imgStr;
  return `${basePath}${imgStr.startsWith('/') ? '' : '/'}${imgStr}`;
};

export default async function BlogListing() {
  await connectToDatabase();
  const blogData = await Blog.find({}).sort({ createdAt: -1 });

  return (
    <div className="w-full flex flex-col items-center bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="w-full bg-white border-b border-gray-100 pt-10 pb-24 px-8 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ff6600]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 translate-y-1/2 -translate-x-1/3"></div>

        <div className="w-full max-w-6xl relative z-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Insights & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7800] to-orange-500">Innovation</span>
          </h1>
          <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto">
            Explore the latest trends, strategies, and technology driving the future of the digital landscape.
          </p>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="w-full max-w-7xl px-6 sm:px-8 py-2 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {blogData.map((blog) => (
            <div key={blog._id.toString()} className="group bg-white rounded-[2rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col">
              {/* Image Container */}
              <div className="relative w-full h-64 overflow-hidden bg-gray-100 cursor-pointer">
                <Link href={`/blog/${blog.slug}`}>
                  <Image
                    src={getImageUrl(blog.image)}
                    alt={blog.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
                </Link>

              </div>

              {/* Content Container */}
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 font-medium uppercase tracking-wide">
                  <span>{blog.date}</span>
               
                 
                </div>

                <Link href={`/blog/${blog.slug}`}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-[#ff6600] transition-colors line-clamp-2 leading-tight cursor-pointer">
                    {blog.title}
                  </h2>
                </Link>

                <p className="text-gray-600 mb-8 line-clamp-3 leading-relaxed flex-grow text-base">
                  {blog.excerpt}
                </p>

                <Link href={`/blog/${blog.slug}`} className="mt-auto w-full">
                  <button className="w-full bg-gray-50 hover:bg-gradient-to-r hover:from-[#ff7800] hover:to-orange-500 text-gray-700 hover:text-white border border-gray-200 hover:border-transparent py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-sm hover:shadow-lg hover:shadow-orange-500/25">
                    Read More
                    <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
