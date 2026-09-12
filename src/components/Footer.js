import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#2a2a2a] text-gray-300 pt-12 pb-6 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[2fr_1fr_2fr] gap-12 lg:gap-16 mb-12">
        <div className="pr-0 md:pr-8">
          <h3 className="text-xl font-semibold text-white mb-4">About</h3>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Over the years of experience, we gained reputation in web design services, seo services, web development and mobile app development services. We take pride in saying that we have completed more than 1200+ projects till date.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-medium">
            Get Started
          </button>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Quick Links</h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li><Link href="/" className="hover:text-white">&gt; Home</Link></li>
            <li><Link href="/blog" className="hover:text-white">&gt; Blog</Link></li>
            <li><Link href="https://jayamwebsolutions.com/contact.php" className="hover:text-white">&gt; Contact Us</Link></li>
          </ul>
        </div>
        <div className="w-full h-48 md:h-full min-h-[200px]">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d31110.263761046106!2d80.092092!3d12.921666!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a525f722faf2fdf%3A0x8c73da26bfb432cd!2sJayam%20Web%20Solutions%20Pvt%20Ltd!5e0!3m2!1sen!2sin!4v1780033462070!5m2!1sen!2sin" 
            className="w-full h-full rounded shadow-sm border border-gray-600"
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto border-t border-gray-700 pt-8 flex flex-col items-center">
        <h4 className="text-white mb-4">Follow Us</h4>
        <div className="flex space-x-4 mb-6">
          <a href="https://www.facebook.com/Career-At-Jayam-Web-Solutions-107079867434353" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-gray-500 flex items-center justify-center hover:bg-[#1877F2] hover:border-[#1877F2] transition-colors cursor-pointer text-gray-400 hover:text-white">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
            </svg>
          </a>
          <a href="https://x.com/careeratjayam" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-gray-500 flex items-center justify-center hover:bg-gray-800 hover:border-gray-800 transition-colors cursor-pointer text-gray-400 hover:text-white">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="https://www.linkedin.com/404/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-gray-500 flex items-center justify-center hover:bg-[#0A66C2] hover:border-[#0A66C2] transition-colors cursor-pointer text-gray-400 hover:text-white">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
            </svg>
          </a>
          <a href="https://www.instagram.com/careeratjayamweb/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-gray-500 flex items-center justify-center hover:bg-[#E4405F] hover:border-[#E4405F] transition-colors cursor-pointer text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <a href="https://in.pinterest.com/careeratjayamwebsolutions/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-gray-500 flex items-center justify-center hover:bg-[#BD081C] hover:border-[#BD081C] transition-colors cursor-pointer text-gray-400 hover:text-white">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.168 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.624 0 12.017 0z"/>
            </svg>
          </a>
        </div>
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} <span className="font-semibold text-gray-400">JAYAM WEB SOLUTIONS</span>. All Rights Reserved.
        </p>
        
      </div>
    </footer>
  );
}
