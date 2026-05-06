import React, { useState, useEffect } from 'react';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose }) => {
  const [showMessage, setShowMessage] = useState(true);
  const [donationAmount, setDonationAmount] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset to show message when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowMessage(true);
      setIsSuccess(false);
      // Auto-fade message after 15 seconds
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleDonate = (method: string) => {
    setIsProcessing(true);
    
    // In production, redirect to actual payment
    // For now, simulate success
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        onClose();
      }, 3000);
    }, 1500);
  };

  const skipMessage = () => {
    setShowMessage(false);
  };

  if (!isOpen) return null;

  const presetAmounts = [5, 10, 25, 50, 100];

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl max-w-lg w-full overflow-hidden border border-pink-500/30 my-auto">
        
        {/* Close Button */}
        <div className="flex justify-end p-4 pb-0">
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={isProcessing}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Heartfelt Message */}
        {showMessage && !isSuccess && (
          <div className="p-8 text-center animate-fade-in">
            <div className="text-6xl mb-6">🎵❤️🎸</div>
            
            <h2 className="text-2xl font-bold text-pink-400 mb-4">
              Every Child Deserves Music
            </h2>
            
            <div className="text-gray-300 space-y-4 text-lg leading-relaxed">
              <p>
                Across the country, <span className="text-white font-semibold">school music programs are being cut</span> due to budget constraints.
              </p>
              <p>
                Thousands of children who dream of singing, playing guitar, or joining the school band <span className="text-white font-semibold">can't afford instruments</span>.
              </p>
              <p>
                Your donation helps put <span className="text-pink-400 font-semibold">instruments in the hands of kids</span> who otherwise would never get the chance to discover their musical talent.
              </p>
              <p className="text-xl text-white font-bold pt-2">
                🌟 You could help create the next star! 🌟
              </p>
            </div>

            <button
              onClick={skipMessage}
              className="mt-8 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl hover:scale-105 transition transform"
            >
              I Want to Help! 💜
            </button>
            
            <p className="mt-4 text-gray-500 text-sm">
              Auto-continuing in a few seconds...
            </p>
          </div>
        )}

        {/* Donation Options */}
        {!showMessage && !isSuccess && (
          <div className="p-8 animate-fade-in">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🎹🎺🎻</div>
              <h2 className="text-xl font-bold text-white">Choose Your Donation</h2>
              <p className="text-gray-400 text-sm">100% goes to instruments for kids in need</p>
            </div>

            {/* Amount Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3 text-gray-300">Select Amount</label>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setDonationAmount(amount)}
                    className={`py-3 px-2 rounded-xl border text-lg font-bold ${
                      donationAmount === amount
                        ? 'border-pink-500 bg-pink-500/20 text-pink-400'
                        : 'border-gray-700 hover:border-gray-500 text-gray-300'
                    } transition`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                <input
                  type="number"
                  min="1"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(Number(e.target.value) || 0)}
                  className="w-full py-3 pl-8 pr-4 bg-black/40 border border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-lg text-white"
                  placeholder="Custom amount"
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <button
                onClick={() => handleDonate('card')}
                disabled={isProcessing || donationAmount <= 0}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-lg hover:scale-[1.02] transition transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>💳 Donate ${donationAmount} with Card</>
                )}
              </button>
              
              <button
                onClick={() => handleDonate('paypal')}
                disabled={isProcessing || donationAmount <= 0}
                className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                🅿️ PayPal
              </button>
              
              <button
                onClick={() => handleDonate('venmo')}
                disabled={isProcessing || donationAmount <= 0}
                className="w-full py-4 rounded-xl bg-[#008CFF] text-white font-bold text-lg hover:bg-[#0070CC] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                ✌️ Venmo
              </button>
              
              <button
                onClick={() => handleDonate('cashapp')}
                disabled={isProcessing || donationAmount <= 0}
                className="w-full py-4 rounded-xl bg-[#00D632] text-black font-bold text-lg hover:bg-[#00B82B] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                💵 Cash App
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-gray-500">
              StarPrepAI partners with music education nonprofits
            </p>
          </div>
        )}

        {/* Success Message */}
        {isSuccess && (
          <div className="p-8 text-center animate-fade-in">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">🎉</span>
            </div>
            <h3 className="text-2xl font-bold text-green-400 mb-2">Thank You!</h3>
            <p className="text-gray-300 text-lg">Your generosity will help a child discover their musical dreams.</p>
            <p className="text-pink-400 mt-4 text-xl">🌟 You're a star! 🌟</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonateModal;
