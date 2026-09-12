"use client"
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ImageSlider() {
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const base = process.env.NEXT_PUBLIC_BASE_URL || '';
  const images = [`${base}/image1.jpg`, `${base}/image2.jpg`];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
    }, 4500); // Slower, elegant transition every 4.5s

    return () => clearInterval(timer);
  }, [images.length]);

  const nextSlide = () => setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  const prevSlide = () => setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));

  return (
    <div className="relative w-full h-[350px] md:h-[450px] rounded-2xl overflow-hidden shadow-lg group bg-gray-50 border border-gray-100">
      {images.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-all duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${index === currentIndex
              ? 'opacity-100 z-10 scale-100'
              : 'opacity-0 z-0 scale-[1.03] pointer-events-none'
            }`}
        >
          <Image
            src={src}
            alt={`Industry Slide ${index + 1}`}
            fill
            className="object-container"
            priority={index === 0}
          />
          {/* Subtle gradient overlay to make dots and arrows pop */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-80" />
        </div>
      ))}

      {/* Glassmorphism Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/40 hover:scale-110"
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5 ml-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/40 hover:scale-110"
        aria-label="Next slide"
      >
        <svg className="w-5 h-5 mr-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
      </button>

      {/* Modern Pill-shaped Indicators */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-500 ease-out ${index === currentIndex
                ? 'w-10 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                : 'w-2.5 bg-white/50 hover:bg-white/80'
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
