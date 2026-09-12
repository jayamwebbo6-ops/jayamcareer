'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HeroSearchForm({ categories }: { categories: { id: string, name: string }[] }) {
  const [selectedRole, setSelectedRole] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) {
      const slug = `/job/${selectedRole.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`;
      router.push(slug);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center w-full md:w-auto gap-4">
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
        className="px-6 py-4 bg-white/95 text-gray-800 w-full sm:w-80 focus:outline-none border-2 border-transparent focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/20 cursor-pointer text-sm font-medium appearance-none rounded-full shadow-inner transition-all" 
        style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23ff6600\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1.25em' }}
      >
        <option value="" disabled>Select a Job Role...</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.name}>{cat.name}</option>
        ))}
      </select>
            
      <button 
        type="submit"
        disabled={!selectedRole}
        className={`bg-gradient-to-r from-[#ff7800] to-orange-500 hover:from-orange-600 hover:to-[#ff7800] text-white px-10 py-4 text-sm font-bold tracking-wide transition-all rounded-full shadow-lg hover:shadow-orange-500/30 w-full sm:w-auto transform ${selectedRole ? 'hover:scale-[1.02] active:scale-[0.98]' : 'opacity-80 cursor-not-allowed'}`}
      >
        SUBMIT
      </button>
    </form>
  );
}
