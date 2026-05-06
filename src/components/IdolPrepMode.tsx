import React from 'react';

const IdolPrepMode: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="glass-panel p-8 rounded-2xl">
        <h1 className="text-3xl font-bold mb-6 text-neonPink">Idol Preparation</h1>
        <div className="space-y-6">
          <div className="bg-white/5 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-3">Vocal Training</h2>
            <p className="text-gray-300 mb-4">Practice your singing with our AI vocal coach.</p>
            <button className="px-4 py-2 bg-neonPink/20 text-neonPink border border-neonPink/50 rounded-lg hover:bg-neonPink/30 transition">
              Start Vocal Exercise
            </button>
          </div>
          
          <div className="bg-white/5 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-3">Dance Practice</h2>
            <p className="text-gray-300 mb-4">Learn and practice dance routines.</p>
            <button className="px-4 py-2 bg-neonPink/20 text-neonPink border border-neonPink/50 rounded-lg hover:bg-neonPink/30 transition">
              Start Dance Practice
            </button>
          </div>
          
          <div className="bg-white/5 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-3">Performance Tips</h2>
            <p className="text-gray-300 mb-4">Get expert advice on stage presence and performance.</p>
            <button className="px-4 py-2 bg-neonPink/20 text-neonPink border border-neonPink/50 rounded-lg hover:bg-neonPink/30 transition">
              View Tips
            </button>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/10">
          <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span>Vocal Range</span>
                <span>65%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-neonPink h-2.5 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Dance Skills</span>
                <span>40%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-neonPink h-2.5 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Stage Presence</span>
                <span>55%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-neonPink h-2.5 rounded-full" style={{ width: '55%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdolPrepMode;
