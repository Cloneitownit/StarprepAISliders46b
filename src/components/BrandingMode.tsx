import React, { useState } from 'react';

const BrandingMode: React.FC = () => {
  const [brandName, setBrandName] = useState('');
  const [brandSlogan, setBrandSlogan] = useState('');
  const [brandColors, setBrandColors] = useState({
    primary: '#FF2D55',
    secondary: '#5856D6',
    accent: '#FF9500',
  });
  const [logoDesign, setLogoDesign] = useState('modern');
  
  const colorOptions = [
    { name: 'Vibrant', primary: '#FF2D55', secondary: '#5856D6', accent: '#FF9500' },
    { name: 'Elegant', primary: '#8E44AD', secondary: '#2C3E50', accent: '#E74C3C' },
    { name: 'Fresh', primary: '#2ECC71', secondary: '#3498DB', accent: '#F1C40F' },
    { name: 'Bold', primary: '#E74C3C', secondary: '#E67E22', accent: '#F1C40F' },
  ];

  const logoDesigns = [
    { id: 'modern', name: 'Modern', icon: '✨' },
    { id: 'classic', name: 'Classic', icon: '🎨' },
    { id: 'minimal', name: 'Minimal', icon: '⭕' },
    { id: 'abstract', name: 'Abstract', icon: '🔶' },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="glass-panel p-8 rounded-2xl">
        <h1 className="text-3xl font-bold mb-8 text-neonPink">Brand Identity Studio</h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand Info Form */}
          <div className="md:col-span-1 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Brand Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Enter brand name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-neonPink focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={brandSlogan}
                    onChange={(e) => setBrandSlogan(e.target.value)}
                    placeholder="Your brand's tagline"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-neonPink focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Color Palette</h2>
              <div className="grid grid-cols-2 gap-4">
                {colorOptions.map((palette) => (
                  <button
                    key={palette.name}
                    onClick={() => setBrandColors({
                      primary: palette.primary,
                      secondary: palette.secondary,
                      accent: palette.accent,
                    })}
                    className="p-3 rounded-lg border border-white/10 hover:border-neonPink/50 transition-colors"
                  >
                    <div className="flex h-16 rounded overflow-hidden mb-2">
                      <div className="flex-1" style={{ backgroundColor: palette.primary }} />
                      <div className="flex-1" style={{ backgroundColor: palette.secondary }} />
                      <div className="flex-1" style={{ backgroundColor: palette.accent }} />
                    </div>
                    <span className="text-xs text-gray-300">{palette.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Logo Style</h2>
              <div className="grid grid-cols-4 gap-2">
                {logoDesigns.map((design) => (
                  <button
                    key={design.id}
                    onClick={() => setLogoDesign(design.id)}
                    className={`p-3 rounded-lg border ${
                      logoDesign === design.id 
                        ? 'border-neonPink bg-neonPink/10' 
                        : 'border-white/10 hover:border-white/30'
                    } transition-colors flex flex-col items-center`}
                  >
                    <span className="text-2xl mb-1">{design.icon}</span>
                    <span className="text-xs">{design.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="md:col-span-2">
            <div className="sticky top-6">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 shadow-2xl border border-white/10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: brandColors.primary }}>
                      {brandName || 'Your Brand'}
                    </h2>
                    {brandSlogan && (
                      <p className="text-gray-400 text-sm mt-1">{brandSlogan}</p>
                    )}
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl" 
                       style={{ backgroundColor: brandColors.primary, color: 'white' }}>
                    {brandName ? brandName[0].toUpperCase() : 'B'}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${brandColors.primary}20` }}>
                    <h3 className="font-semibold mb-2" style={{ color: brandColors.primary }}>Primary Color</h3>
                    <p className="text-sm text-gray-300">Used for primary actions and important elements.</p>
                  </div>
                  
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${brandColors.secondary}20` }}>
                    <h3 className="font-semibold mb-2" style={{ color: brandColors.secondary }}>Secondary Color</h3>
                    <p className="text-sm text-gray-300">Used for secondary elements and backgrounds.</p>
                  </div>
                  
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${brandColors.accent}20` }}>
                    <h3 className="font-semibold mb-2" style={{ color: brandColors.accent }}>Accent Color</h3>
                    <p className="text-sm text-gray-300">Used for highlights and calls to action.</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Preview Mode</span>
                    <button 
                      className="px-4 py-2 rounded-lg font-medium"
                      style={{
                        backgroundColor: brandColors.primary,
                        color: 'white',
                      }}
                    >
                      Save Brand Identity
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingMode;
