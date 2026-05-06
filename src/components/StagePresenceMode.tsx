import React from 'react';

const StagePresenceMode: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="glass-panel p-8 rounded-2xl">
        <h1 className="text-3xl font-bold mb-6 text-neonPink">Stage Presence</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-3">Pose Practice</h2>
            <p className="text-gray-300 mb-4">Practice different stage poses and positions.</p>
            <button className="px-4 py-2 bg-neonPink/20 text-neonPink border border-neonPink/50 rounded-lg hover:bg-neonPink/30 transition">
              Start Pose Practice
            </button>
          </div>
          
          <div className="bg-white/5 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-3">Stage Movement</h2>
            <p className="text-gray-300 mb-4">Learn how to move confidently on stage.</p>
            <button className="px-4 py-2 bg-neonPink/20 text-neonPink border border-neonPink/50 rounded-lg hover:bg-neonPink/30 transition">
              Start Movement Training
            </button>
          </div>
          
          <div className="bg-white/5 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-3">Audience Engagement</h2>
            <p className="text-gray-300 mb-4">Learn how to connect with your audience.</p>
            <button className="px-4 py-2 bg-neonPink/20 text-neonPink border border-neonPink/50 rounded-lg hover:bg-neonPink/30 transition">
              Learn Engagement
            </button>
          </div>
          
          <div className="bg-white/5 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-3">Performance Review</h2>
            <p className="text-gray-300 mb-4">Get AI feedback on your stage presence.</p>
            <button className="px-4 py-2 bg-neonPink/20 text-neonPink border border-neonPink/50 rounded-lg hover:bg-neonPink/30 transition">
              Start Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StagePresenceMode;
