"use client"
import { useState } from 'react';

export default function ManageOpenings() {
  // Mock data representing database rows
  const [openings, setOpenings] = useState([
    { id: 1, category: 'Web Developer', location: 'Tambaram West, Chennai', hours: '48h / week', status: 'Active' }
  ]);

  // These would be dynamically fetched from the Categories table in the future
  const availableCategories = ['Web Developer', 'SEO Analyst', 'Web Designer', 'Digital Marketing', 'Android Developer', 'iOS Developer'];

  const [isAdding, setIsAdding] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Current Openings</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-[#ff6600] hover:bg-[#e65c00] text-white px-4 py-2 rounded shadow text-sm font-medium transition-colors">
          {isAdding ? 'Cancel' : '+ Post New Opening'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded shadow-sm border border-gray-200 mb-8 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-lg font-medium mb-4 text-[#225599]">Post a Job Opening</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select from Existing Categories</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 bg-white outline-none focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]">
                <option value="">-- Choose Category --</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">This links the opening to the category's description and responsibilities.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]" defaultValue="Tambaram West, Chennai" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours</label>
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]" defaultValue="48h / week" />
            </div>
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow text-sm font-medium transition-colors">
            Publish Live on Website
          </button>
        </div>
      )}

      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
              <th className="px-6 py-3 font-medium">Job Category</th>
              <th className="px-6 py-3 font-medium">Location</th>
              <th className="px-6 py-3 font-medium">Hours</th>
              <th className="px-6 py-3 font-medium w-32 text-center">Status</th>
              <th className="px-6 py-3 font-medium w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {openings.map((opening) => (
              <tr key={opening.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-[#225599]">{opening.category}</td>
                <td className="px-6 py-4 text-gray-600">{opening.location}</td>
                <td className="px-6 py-4 text-gray-600">{opening.hours}</td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                    {opening.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-red-600 hover:text-red-800 font-medium">Close Job</button>
                </td>
              </tr>
            ))}
            {openings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No active openings. Publish one to show it on the site.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
