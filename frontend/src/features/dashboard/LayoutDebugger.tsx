import React, { useEffect, useState } from 'react';

export const LayoutDebugger: React.FC = () => {
  const [dimensions, setDimensions] = useState({
    viewport: { width: 0, height: 0 },
    container: { width: 0, height: 0 }
  });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        container: {
          width: document.querySelector('.layout-debugger')?.clientWidth || 0,
          height: document.querySelector('.layout-debugger')?.clientHeight || 0
        }
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div className="layout-debugger w-full mb-4">
      <div className="bg-yellow-100 border-2 border-yellow-400 rounded p-2 text-sm">
        <h3 className="font-bold text-yellow-800">Layout Debugger</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p>Viewport width: {dimensions.viewport.width}px</p>
            <p>Container width: {dimensions.container.width}px</p>
          </div>
          <div>
            <p>Viewport height: {dimensions.viewport.height}px</p>
            <p>Container height: {dimensions.container.height}px</p>
          </div>
        </div>
        <div className="mt-2">
          <div className="w-full h-6 bg-gray-200 relative">
            <div 
              className="h-full bg-green-500" 
              style={{ width: `${(dimensions.container.width / dimensions.viewport.width) * 100}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs">
              Container: {Math.round((dimensions.container.width / dimensions.viewport.width) * 100)}% of viewport
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 