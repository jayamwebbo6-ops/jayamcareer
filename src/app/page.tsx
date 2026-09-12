import Image from 'next/image';
import Link from 'next/link';
import ImageSlider from '../components/ImageSlider';
import HeroSearchForm from '../components/HeroSearchForm';
import { connectToDatabase } from '../lib/mongoDb';
import Category from '../models/Category';

export const dynamic = 'force-dynamic';

export default async function Home() {
  await connectToDatabase();
  const allCategories = await Category.find({}).sort({ displayOrder: 1, createdAt: -1 });
  const activeCategories = allCategories.filter(cat => cat.isActive);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero Section */}
      <div className="relative w-full h-[500px] md:h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/hero-bg.png`}
          alt="Torn Paper Background"
          fill
          className="object-cover object-center z-0 scale-105"
          priority
        />

        {/* Dark subtle overlay for contrast */}
        <div className="absolute inset-0 bg-black/40 z-0" />

        {/* Premium Glassmorphism Overlay Box */}
        <div className="relative z-10 bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl w-[92%] sm:w-[85%] md:w-auto py-10 sm:py-12 px-6 sm:px-12 flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8 transform transition-all hover:bg-white/15 duration-500">
          <span className="text-white text-xl md:text-2xl font-bold tracking-[0.2em] text-center drop-shadow-md">
            APPLY FOR
          </span>

          <HeroSearchForm categories={allCategories.map(cat => ({ id: cat._id.toString(), name: cat.name }))} />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-6xl px-4 py-8 flex flex-col gap-12">

        {/* Job Categories Section */}
        <section className="py-4">
          <div className="flex flex-col items-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl text-gray-900 font-bold mb-3">Job Categories</h2>
            <div className="w-16 h-1 bg-[#ff6600] rounded-full"></div>
          </div>

          {allCategories.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No job categories found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {allCategories.map((cat) => {
                const slug = `/job/${cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`;
                return (
                  <Link href={slug} key={cat._id.toString()} className="group bg-white border border-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl z-0" />
                    <div className="relative z-10 w-20 h-20 rounded-full bg-orange-50 group-hover:bg-[#ff6600] flex items-center justify-center transition-colors duration-300 mb-5">
                      <span className="material-symbols-outlined text-4xl text-[#ff6600] group-hover:text-white transition-colors duration-300">
                        {cat.icon || 'work'}
                      </span>
                    </div>
                    <span className="relative z-10 text-gray-800 font-bold text-lg group-hover:text-[#ff6600] transition-colors duration-300 text-center">{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Current Openings & Industry Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 sm:gap-12 mt-8 sm:mt-12">

          {/* Left Column: Current Openings */}
          <section>
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl text-gray-900 font-bold">Current Openings</h2>
            </div>

            <div className="flex flex-col gap-4">
              {activeCategories.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No current openings available.</div>
              ) : (
                activeCategories.map((cat) => {
                  const slug = `/job/${cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`;
                  return (
                    <Link href={slug} key={cat._id.toString()} className="group bg-white border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                      <div className="flex items-center gap-5 mb-4 sm:mb-0">
                        <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 shrink-0 group-hover:scale-110 group-hover:bg-[#ff6600] group-hover:text-white transition-all duration-300">
                          <span className="material-symbols-outlined text-2xl">{cat.icon || 'work'}</span>
                        </div>
                        <div>
                          <h3 className="text-gray-800 font-bold text-lg group-hover:text-[#ff6600] transition-colors">{cat.name}</h3>
                          <p className="text-gray-400 text-sm mt-0.5">Chennai, India</p>
                        </div>
                      </div>
                      <button className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-5 py-2 text-sm font-semibold rounded-full w-full sm:w-auto transition-colors flex items-center justify-center gap-2">
                        Full-Time
                        <svg className="w-3.5 h-3.5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </button>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          {/* Right Column: Industry Image Slider */}
          <section>
            <h2 className="text-2xl sm:text-3xl text-gray-900 font-bold mb-6 sm:mb-8 leading-snug">What happens in the <br /><span className="text-[#ff6600]">Industry?</span></h2>
            <ImageSlider />
          </section>
        </div>

      </div>
    </div>
  );
}
