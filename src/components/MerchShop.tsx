import React, { useState } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'merch' | 'microphone';
  colors?: string[];
  sizes?: string[];
  rating?: number;
  badge?: string;
}

const SAMPLE_PRODUCTS: Product[] = [
  // Merch
  {
    id: 'm1',
    name: 'Golden Ticket Holder Tee',
    description: 'Show off your StarPrep journey with this premium cotton tee.',
    price: 29.99,
    image: '👕',
    category: 'merch',
    colors: ['Black', 'White', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    badge: 'Best Seller',
  },
  {
    id: 'm2',
    name: 'SP.AI Logo Hoodie',
    description: 'Cozy up in studio mode with our premium hoodie.',
    price: 54.99,
    image: '🧥',
    category: 'merch',
    colors: ['Black', 'Gray'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },
  {
    id: 'm3',
    name: '4 Words 1 Song Tee',
    description: '4 WORDS. 1 SONG. INFINITE POSSIBILITIES.',
    price: 27.99,
    image: '👕',
    category: 'merch',
    colors: ['Black', 'Gold'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'm4',
    name: 'Vocal Athlete Hoodie',
    description: 'Train. Clone. Dominate. Athletic style meets music.',
    price: 59.99,
    image: '🧥',
    category: 'merch',
    colors: ['Red/Black', 'Black'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    badge: 'New',
  },
  // Microphones
  {
    id: 'mic1',
    name: 'StarPrep Pro USB Mic',
    description: 'Professional USB condenser microphone. Perfect for recording your 4 words with crystal clarity.',
    price: 79.99,
    image: '🎤',
    category: 'microphone',
    rating: 4.8,
    badge: 'Recommended',
  },
  {
    id: 'mic2',
    name: 'Budget Starter Mic',
    description: 'Great entry-level USB mic for beginners. Plug and play simplicity.',
    price: 29.99,
    image: '🎙️',
    category: 'microphone',
    rating: 4.2,
  },
  {
    id: 'mic3',
    name: 'Studio Elite XLR',
    description: 'Professional XLR microphone for serious vocalists. Requires audio interface.',
    price: 149.99,
    image: '🎤',
    category: 'microphone',
    rating: 4.9,
    badge: 'Pro Choice',
  },
  {
    id: 'mic4',
    name: 'Wireless Performance Mic',
    description: 'Freedom to move! Great for stage presence practice.',
    price: 119.99,
    image: '📡',
    category: 'microphone',
    rating: 4.5,
  },
];

interface MerchShopProps {
  onBack?: () => void;
}

const MerchShop: React.FC<MerchShopProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'merch' | 'microphone'>('merch');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [cart, setCart] = useState<Array<{product: Product; size?: string; color?: string; quantity: number}>>([]);
  const [showCart, setShowCart] = useState(false);

  const filteredProducts = SAMPLE_PRODUCTS.filter(p => p.category === activeTab);

  const addToCart = () => {
    if (!selectedProduct) return;
    
    if (selectedProduct.category === 'merch' && (!selectedSize || !selectedColor)) {
      alert('Please select size and color');
      return;
    }

    setCart([...cart, {
      product: selectedProduct,
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
    }]);
    
    setSelectedProduct(null);
    setSelectedSize('');
    setSelectedColor('');
    alert('Added to cart! 🛒');
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neonPink to-purple-500 mb-2">
            StarPrep Shop 🛍️
          </h1>
          <p className="text-gray-400">Gear up for your journey to stardom!</p>
        </div>

        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 text-gray-400 hover:text-white transition flex items-center gap-2"
          >
            ← Back to Home
          </button>
        )}

        {/* Cart Button */}
        <button
          onClick={() => setShowCart(true)}
          className="fixed top-20 right-4 bg-neonPink text-white px-4 py-2 rounded-full font-bold z-50 flex items-center gap-2 shadow-lg"
        >
          🛒 Cart ({cart.length})
        </button>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('merch')}
            className={`px-6 py-3 rounded-xl font-bold transition ${
              activeTab === 'merch'
                ? 'bg-gradient-to-r from-neonPink to-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            👕 Merch
          </button>
          <button
            onClick={() => setActiveTab('microphone')}
            className={`px-6 py-3 rounded-xl font-bold transition ${
              activeTab === 'microphone'
                ? 'bg-gradient-to-r from-neonBlue to-cyan-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            🎤 Microphones
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="bg-white/5 border border-gray-700 rounded-2xl p-6 cursor-pointer hover:bg-white/10 hover:border-neonPink/50 transition-all duration-300 hover:-translate-y-2 relative"
            >
              {product.badge && (
                <span className="absolute top-3 right-3 bg-gradient-to-r from-gold to-orange-500 text-black text-[10px] px-2 py-1 rounded-full font-bold uppercase">
                  {product.badge}
                </span>
              )}
              <div className="text-6xl mb-4 text-center">{product.image}</div>
              <h3 className="font-bold text-white mb-2">{product.name}</h3>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
              {product.rating && (
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm text-gray-300">{product.rating}</span>
                </div>
              )}
              <p className="text-2xl font-bold text-neonPink">${product.price}</p>
            </div>
          ))}
        </div>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f0f13] border border-gray-700 rounded-2xl p-8 max-w-md w-full">
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setSelectedSize('');
                  setSelectedColor('');
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                ✕
              </button>
              
              <div className="text-8xl mb-6 text-center">{selectedProduct.image}</div>
              <h2 className="text-2xl font-bold text-white mb-2">{selectedProduct.name}</h2>
              <p className="text-gray-400 mb-4">{selectedProduct.description}</p>
              <p className="text-3xl font-bold text-neonPink mb-6">${selectedProduct.price}</p>

              {/* Size Selector (Merch only) */}
              {selectedProduct.sizes && (
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-lg border transition ${
                          selectedSize === size
                            ? 'border-neonPink bg-neonPink/20 text-white'
                            : 'border-gray-600 text-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector (Merch only) */}
              {selectedProduct.colors && (
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-lg border transition ${
                          selectedColor === color
                            ? 'border-neonPink bg-neonPink/20 text-white'
                            : 'border-gray-600 text-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={addToCart}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-neonPink to-purple-600 text-white font-bold text-lg hover:opacity-90 transition"
              >
                Add to Cart 🛒
              </button>
            </div>
          </div>
        )}

        {/* Cart Modal */}
        {showCart && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f0f13] border border-gray-700 rounded-2xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Your Cart 🛒</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
              
              {cart.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 py-4 border-b border-gray-700">
                      <span className="text-4xl">{item.product.image}</span>
                      <div className="flex-1">
                        <p className="font-bold text-white">{item.product.name}</p>
                        {item.size && <p className="text-sm text-gray-400">Size: {item.size}</p>}
                        {item.color && <p className="text-sm text-gray-400">Color: {item.color}</p>}
                        <p className="text-neonPink font-bold">${item.product.price}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  
                  <div className="mt-6 pt-4 border-t border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl text-white">Total:</span>
                      <span className="text-2xl font-bold text-neonPink">${cartTotal.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => alert('Checkout coming soon! 🚀')}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg hover:opacity-90 transition"
                    >
                      Checkout 💳
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchShop;
