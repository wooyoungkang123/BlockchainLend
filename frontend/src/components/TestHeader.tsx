import React from 'react';
import { ChevronDown, Wallet } from 'lucide-react';

export const TestHeader: React.FC = () => {
  return (
    <div className="p-4 bg-white border-b border-gray-200">
      <h1 className="text-center text-xl font-bold text-black mb-4">Test Header Component</h1>
      
      <div className="flex flex-col space-y-4">
        <div className="p-4 bg-red-100 rounded">
          <h2 className="text-red-800 font-medium">Background Test</h2>
          <p className="text-gray-800">This background should be light red</p>
        </div>
        
        <div className="p-4 bg-blue-100 rounded">
          <h2 className="text-blue-800 font-medium">Button Test</h2>
          <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center">
            <Wallet size={16} className="mr-2" />
            Test Button
          </button>
        </div>
        
        <div className="p-4 bg-green-100 rounded">
          <h2 className="text-green-800 font-medium">Icon Test</h2>
          <div className="flex items-center mt-2">
            <ChevronDown size={24} className="text-green-600" />
            <span className="ml-2 text-gray-800">This icon should be green</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 