import React from 'react';

const DuetMode: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="glass-panel p-8 rounded-2xl">
        <h1 className="text-3xl font-bold mb-6 text-neonPink">Duet Mode</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-3">Sing a Duet</h2>
            <p className="text-gray-300 mb-4">Sing along with AI or invite a friend for a duet.</p>
            <button className="px-4 py-2 bg-neonPink/20 text-neonPink border border-neonPink/50 rounded-lg hover:bg-neonPink/30 transition mb-3 w-full">
              Sing with AI
            </button>
            <button className="px-4 py-2 bg-neonBlue/20 text-neonBlue border border-neonBlue/50 rounded-lg hover:bg-neonBlue/30 transition w-full">
              Invite Friend
            </button>
          </div>
          
          <div className="bg-white/5 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-3">Popular Duets</h2>
            <div className="space-y-3">
              {['Shallow', 'A Whole New World', 'The Prayer', 'Endless Love'].map((song) => (
                <div key={song} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg cursor-pointer">
                  <span>{song}</span>
                  <button className="text-neonPink hover:text-neonPink/80">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-2 bg-white/5 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-3">Your Duet Recordings</h2>
            <div className="space-y-3">
              {['Perfect Duet (with AI)', 'Shallow (with Friend)', 'A Whole New World (with AI)'].map((recording, index) => (
                <div key={index} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg">
                  <span className="text-gray-300">{recording}</span>
                  <div className="flex space-x-2">
                    <button className="text-neonPink hover:text-neonPink/80">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                      </svg>
                    </button>
                    <button className="text-neonBlue hover:text-neonBlue/80">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.793.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                      </svg>
                    </button>
                    <button className="text-red-400 hover:text-red-500">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuetMode;
