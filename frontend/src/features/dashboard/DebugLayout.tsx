import React from 'react';

export const DebugLayout: React.FC = () => {
  return (
    <div className="mb-8 p-4 border-2 border-red-500">
      <h2 className="text-center mb-4 font-bold text-xl">Debug Layout Test</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 border-2 border-blue-500">
        <div className="bg-blue-100 p-4 rounded min-h-[200px] border border-blue-300">
          <h3 className="font-bold">Grid Item 1</h3>
          <p>This should be on the left in medium+ screens</p>
        </div>
        <div className="bg-green-100 p-4 rounded min-h-[200px] border border-green-300">
          <h3 className="font-bold">Grid Item 2</h3>
          <p>This should be on the right in medium+ screens</p>
        </div>
      </div>
      
      <p className="text-sm text-gray-500 mb-2">Current screen width:</p>
      <div className="grid grid-cols-5 gap-1 text-xs text-center">
        <div className="bg-red-200 p-1 sm:hidden">xs only</div>
        <div className="hidden sm:block sm:bg-orange-200 p-1 md:hidden">sm only</div>
        <div className="hidden md:block md:bg-yellow-200 p-1 lg:hidden">md only</div>
        <div className="hidden lg:block lg:bg-green-200 p-1 xl:hidden">lg only</div>
        <div className="hidden xl:block xl:bg-blue-200 p-1">xl+</div>
      </div>
    </div>
  );
}; 