import React, { useState } from 'react';
import { SubscriptionTier } from '../types';

interface PricingModalProps {
  onClose: () => void;
  onUpgrade: (tier: SubscriptionTier) => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ onClose, onUpgrade }) => {
  const [step, setStep] = useState<'PLANS' | 'PAYMENT'>('PLANS');
  const [billing, setBilling] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [processing, setProcessing] = useState(false);

  const plans = {
    PRO: {
      name: "Rising Star",
      price: billing === 'MONTHLY' ? 9.99 : 99.00,
      monthlyPrice: 9.99,
      yearlyPrice: 99.00,
      monthlyEquivalent: billing === 'YEARLY' ? 8.25 : 9.99,
      period: billing === 'MONTHLY' ? '/mo' : '/yr',
    },
    SUPERSTAR: {
      name: "Superstar Premium",
      price: billing === 'MONTHLY' ? 29.95 : 239.00,
      monthlyPrice: 29.95,
      yearlyPrice: 239.00,
      monthlyEquivalent: billing === 'YEARLY' ? 19.92 : 29.95,
      period: billing === 'MONTHLY' ? '/mo' : '/yr',
    },
    DIAMOND: {
      name: "Golden Ticket",
      price: billing === 'MONTHLY' ? 49.99 : 399.00,
      monthlyPrice: 49.99,
      yearlyPrice: 399.00,
      monthlyEquivalent: billing === 'YEARLY' ? 33.25 : 49.99,
      period: billing === 'MONTHLY' ? '/mo' : '/yr',
    }
  };

  const calculateSavings = (monthly: number, yearly: number) => {
    const totalMonthly = monthly * 12;
    const savings = totalMonthly - yearly;
    const percent = Math.round((savings / totalMonthly) * 100);
    return percent;
  };

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (tier === 'FREE') {
      onClose(); // Just close for free
    } else {
      setSelectedTier(tier);
      setStep('PAYMENT');
    }
  };

  // Mock Payment Function
  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier) return;
    
    setProcessing(true);
    // Simulate Stripe API delay
    setTimeout(() => {
      setProcessing(false);
      onUpgrade(selectedTier);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-[#0a0a0a] border border-gray-800 rounded-3xl w-full max-w-7xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up custom-scrollbar">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-white z-20"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {step === 'PLANS' ? (
          <div className="p-8 md:p-12">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-center text-white mb-4">Choose Your Path to Stardom</h2>
            <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">Unlock the full potential of your voice. Choose the plan that fits your ambition.</p>
            
            {/* Billing Toggle */}
            <div className="flex justify-center mb-10">
              <div className="bg-gray-800 p-1 rounded-full flex relative">
                <button 
                  onClick={() => setBilling('MONTHLY')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all relative z-10 ${billing === 'MONTHLY' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setBilling('YEARLY')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all relative z-10 flex items-center gap-2 ${billing === 'YEARLY' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Yearly <span className="bg-green-500 text-black text-[10px] px-1.5 rounded">SAVE UP TO 33%</span>
                </button>
                <div 
                  className={`absolute top-1 bottom-1 w-1/2 bg-gray-600 rounded-full transition-all duration-300 ${billing === 'YEARLY' ? 'left-[49%]' : 'left-1'}`}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Free Plan */}
              <div className="border border-gray-700 rounded-2xl p-6 bg-white/5 flex flex-col hover:border-gray-500 transition">
                <div>
                   <h3 className="text-lg font-bold text-gray-300 mb-1">Aspiring Artist</h3>
                   <div className="text-3xl font-bold text-white mb-1">$0</div>
                   <p className="text-gray-500 text-sm mb-6">Forever free</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start text-gray-300 text-sm"><span className="text-green-500 mr-2 mt-0.5">✓</span> <span>Basic Songwriting (Limited)</span></li>
                  <li className="flex items-start text-gray-300 text-sm"><span className="text-green-500 mr-2 mt-0.5">✓</span> <span>Standard Judging Score</span></li>
                  <li className="flex items-start text-gray-300 text-sm"><span className="text-green-500 mr-2 mt-0.5">✓</span> <span>Standard Audio Quality</span></li>
                </ul>
                <button className="w-full py-3 rounded-xl border border-gray-600 text-white font-semibold hover:bg-white/10 transition" onClick={onClose}>
                  Current Plan
                </button>
              </div>

              {/* Pro Plan */}
              <div className="relative border border-neonBlue rounded-2xl p-6 bg-gradient-to-b from-gray-900 to-black flex flex-col shadow-[0_0_20px_rgba(0,243,255,0.1)] hover:scale-105 transition duration-300">
                {billing === 'YEARLY' && (
                   <div className="absolute top-4 right-4 bg-neonBlue/20 text-neonBlue text-xs font-bold px-2 py-1 rounded">
                      SAVE {calculateSavings(plans.PRO.monthlyPrice, plans.PRO.yearlyPrice)}%
                   </div>
                )}
                <div>
                   <h3 className="text-lg font-bold text-neonBlue mb-1">Rising Star</h3>
                   <div className="flex items-baseline gap-1">
                     <div className="text-3xl font-bold text-white">${plans.PRO.price}</div>
                     <span className="text-gray-500 text-sm">{plans.PRO.period}</span>
                   </div>
                   {billing === 'YEARLY' && <p className="text-green-400 text-xs font-bold mb-6">Like paying ${plans.PRO.monthlyEquivalent}/mo</p>}
                   {billing === 'MONTHLY' && <p className="text-gray-500 text-xs mb-6">Billed monthly</p>}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start text-white text-sm"><span className="text-neonBlue mr-2 mt-0.5">✓</span> <span><strong>Unlimited</strong> Songwriting</span></li>
                  <li className="flex items-start text-white text-sm"><span className="text-neonBlue mr-2 mt-0.5">✓</span> <span><strong>Lyric Composer Mode</strong></span></li>
                  <li className="flex items-start text-white text-sm"><span className="text-neonBlue mr-2 mt-0.5">✓</span> <span>Detailed Judge Reports</span></li>
                  <li className="flex items-start text-white text-sm"><span className="text-neonBlue mr-2 mt-0.5">✓</span> <span>Save & Export Songs</span></li>
                </ul>
                <button 
                  onClick={() => handleSelectPlan('PRO')}
                  className="w-full py-3 rounded-xl bg-neonBlue text-black font-bold hover:scale-105 transition"
                >
                  Start Rising
                </button>
              </div>

              {/* Superstar Plan */}
              <div className="relative border-2 border-gold rounded-2xl p-6 bg-gradient-to-b from-amber-950/50 to-black flex flex-col shadow-[0_0_30px_rgba(255,215,0,0.15)] hover:scale-105 transition duration-300">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                   Best Value
                </div>
                {billing === 'YEARLY' && (
                   <div className="absolute top-4 right-4 bg-gold/20 text-gold text-xs font-bold px-2 py-1 rounded">
                      SAVE {calculateSavings(plans.SUPERSTAR.monthlyPrice, plans.SUPERSTAR.yearlyPrice)}%
                   </div>
                )}
                <div>
                   <h3 className="text-lg font-bold text-gold mb-1">Superstar Premium</h3>
                   <div className="flex items-baseline gap-1">
                     <div className="text-3xl font-bold text-white">${plans.SUPERSTAR.price}</div>
                     <span className="text-gray-500 text-sm">{plans.SUPERSTAR.period}</span>
                   </div>
                   {billing === 'YEARLY' && <p className="text-green-400 text-xs font-bold mb-6">Like paying ${plans.SUPERSTAR.monthlyEquivalent}/mo</p>}
                   {billing === 'MONTHLY' && <p className="text-gray-500 text-xs mb-6">Billed monthly</p>}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start text-white text-sm"><span className="text-gold mr-2 mt-0.5">✦</span> <span><strong>AI Vocal Coach Mode</strong></span></li>
                  <li className="flex items-start text-white text-sm"><span className="text-gold mr-2 mt-0.5">✦</span> <span>Everything in Rising Star</span></li>
                  <li className="flex items-start text-white text-sm"><span className="text-gold mr-2 mt-0.5">✦</span> <span>Advanced Vocal Analysis</span></li>
                  <li className="flex items-start text-white text-sm"><span className="text-gold mr-2 mt-0.5">✦</span> <span>Commercial Rights</span></li>
                  <li className="flex items-start text-white text-sm"><span className="text-gold mr-2 mt-0.5">✦</span> <span>Priority Processing</span></li>
                </ul>
                <button 
                  onClick={() => handleSelectPlan('SUPERSTAR')}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-gold to-orange-600 text-black font-bold hover:scale-105 transition shadow-lg"
                >
                  Become a Superstar
                </button>
              </div>

              {/* Golden Ticket Plan */}
              <div className="relative border-2 border-yellow-400 rounded-2xl p-6 bg-gradient-to-b from-yellow-950/50 via-amber-950/30 to-black flex flex-col shadow-[0_0_40px_rgba(250,204,21,0.25)] hover:scale-105 transition duration-300 overflow-hidden">
                {/* Golden sparkle effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-0 left-1/4 w-1 h-1 bg-yellow-200 rounded-full animate-pulse opacity-60"></div>
                  <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-yellow-300 rounded-full animate-pulse opacity-80" style={{animationDelay: '0.5s'}}></div>
                  <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-amber-300 rounded-full animate-pulse opacity-70" style={{animationDelay: '1s'}}></div>
                  <div className="absolute top-1/2 right-1/3 w-0.5 h-0.5 bg-yellow-100 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
                </div>
                
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                   <span>🎫</span> Ultimate
                </div>
                {billing === 'YEARLY' && (
                   <div className="absolute top-4 right-4 bg-yellow-400/20 text-yellow-300 text-xs font-bold px-2 py-1 rounded">
                      SAVE {calculateSavings(plans.DIAMOND.monthlyPrice, plans.DIAMOND.yearlyPrice)}%
                   </div>
                )}
                <div className="relative z-10">
                   <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 mb-1">Golden Ticket</h3>
                   <div className="flex items-baseline gap-1">
                     <div className="text-3xl font-bold text-white">${plans.DIAMOND.price}</div>
                     <span className="text-gray-500 text-sm">{plans.DIAMOND.period}</span>
                   </div>
                   {billing === 'YEARLY' && <p className="text-green-400 text-xs font-bold mb-6">Like paying ${plans.DIAMOND.monthlyEquivalent}/mo</p>}
                   {billing === 'MONTHLY' && <p className="text-gray-500 text-xs mb-6">Billed monthly</p>}
                </div>
                <ul className="space-y-3 mb-8 flex-1 relative z-10">
                  <li className="flex items-start text-white text-sm"><span className="text-yellow-400 mr-2 mt-0.5">🎫</span> <span><strong>AI Voice Cloning</strong></span></li>
                  <li className="flex items-start text-white text-sm"><span className="text-yellow-400 mr-2 mt-0.5">🎫</span> <span><strong>AI Pose Detection</strong> (Dance Coach)</span></li>
                  <li className="flex items-start text-white text-sm"><span className="text-yellow-400 mr-2 mt-0.5">🎫</span> <span><strong>AI Video Instructors</strong></span></li>
                  <li className="flex items-start text-white text-sm"><span className="text-yellow-400 mr-2 mt-0.5">🎫</span> <span>Everything in Superstar</span></li>
                  <li className="flex items-start text-white text-sm"><span className="text-yellow-400 mr-2 mt-0.5">🎫</span> <span>1-on-1 Coaching Sessions</span></li>
                  <li className="flex items-start text-white text-sm"><span className="text-yellow-400 mr-2 mt-0.5">🎫</span> <span>Unlimited HD Exports</span></li>
                  <li className="flex items-start text-white text-sm"><span className="text-yellow-400 mr-2 mt-0.5">🎫</span> <span>White-Glove Support</span></li>
                </ul>
                <button 
                  onClick={() => handleSelectPlan('DIAMOND')}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 text-black font-bold hover:scale-105 transition shadow-lg relative z-10"
                >
                  Get Your Golden Ticket 🎫
                </button>
              </div>
            </div>

            {/* Feature Comparison */}
            <div className="mt-12 text-center">
              <p className="text-gray-500 text-sm">
                All plans include secure payment processing • Cancel anytime • 7-day money-back guarantee
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row h-full min-h-[500px]">
            {/* Payment Left Side */}
            <div className="md:w-1/2 p-8 md:p-12 bg-white/5 border-r border-gray-800">
              <h3 className="text-2xl font-serif font-bold text-white mb-6">Checkout</h3>
              
              {selectedTier && selectedTier !== 'FREE' && (
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-700">
                  <div>
                    <div className="font-bold text-white text-lg">{plans[selectedTier].name}</div>
                    <div className="text-sm text-gray-400">Billed {billing.toLowerCase()}</div>
                  </div>
                  <div className="text-2xl font-bold text-white">${plans[selectedTier].price}</div>
                </div>
              )}

              <div className="space-y-4">
                 {selectedTier === 'DIAMOND' ? (
                   <>
                     <div className="flex items-center text-sm text-gray-300">
                       <div className="w-8 h-8 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center mr-3 font-bold">🎫</div>
                       AI Voice Cloning
                     </div>
                     <div className="flex items-center text-sm text-gray-300">
                       <div className="w-8 h-8 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center mr-3 font-bold">🎫</div>
                       AI Pose Detection
                     </div>
                     <div className="flex items-center text-sm text-gray-300">
                       <div className="w-8 h-8 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center mr-3 font-bold">🎫</div>
                       AI Video Instructors
                     </div>
                     <div className="flex items-center text-sm text-gray-300">
                       <div className="w-8 h-8 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center mr-3 font-bold">🎫</div>
                       All Superstar Features
                     </div>
                   </>
                 ) : selectedTier === 'SUPERSTAR' ? (
                   <>
                     <div className="flex items-center text-sm text-gray-300">
                       <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center mr-3 font-bold">✓</div>
                       Unlock Vocal Coach
                     </div>
                     <div className="flex items-center text-sm text-gray-300">
                       <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center mr-3 font-bold">✓</div>
                       Advanced Analysis
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="flex items-center text-sm text-gray-300">
                       <div className="w-8 h-8 rounded-full bg-neonBlue/20 text-neonBlue flex items-center justify-center mr-3 font-bold">✓</div>
                       Lyric Composer
                     </div>
                     <div className="flex items-center text-sm text-gray-300">
                       <div className="w-8 h-8 rounded-full bg-neonBlue/20 text-neonBlue flex items-center justify-center mr-3 font-bold">✓</div>
                       Export Songs
                     </div>
                   </>
                 )}
                 <div className="flex items-center text-sm text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center mr-3 font-bold">✓</div>
                    Secure Payment
                 </div>
              </div>
              <button onClick={() => setStep('PLANS')} className="mt-8 text-sm text-gray-400 hover:text-white underline">
                &larr; Change Plan
              </button>
            </div>

            {/* Payment Right Side (Mock Form) */}
            <div className="md:w-1/2 p-8 md:p-12">
               <h3 className="text-xl font-bold text-white mb-6">Payment Details</h3>
               <form onSubmit={handlePayment} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Email</label>
                    <input type="email" required placeholder="you@example.com" className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-neonBlue outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Card Information</label>
                    <div className="border border-gray-700 rounded-lg bg-black overflow-hidden focus-within:border-neonBlue transition">
                       <input type="text" required placeholder="0000 0000 0000 0000" className="w-full bg-transparent p-3 text-white outline-none border-b border-gray-800" />
                       <div className="flex">
                          <input type="text" required placeholder="MM / YY" className="w-1/2 bg-transparent p-3 text-white outline-none border-r border-gray-800" />
                          <input type="text" required placeholder="CVC" className="w-1/2 bg-transparent p-3 text-white outline-none" />
                       </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Cardholder Name</label>
                    <input type="text" required placeholder="John Doe" className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-neonBlue outline-none transition" />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={processing}
                    className={`
                      w-full mt-6 py-4 rounded-xl font-bold transition flex justify-center items-center shadow-lg
                      ${selectedTier === 'DIAMOND'
                        ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 text-black hover:scale-105'
                        : selectedTier === 'SUPERSTAR' 
                          ? 'bg-gradient-to-r from-gold to-orange-600 text-black hover:scale-105' 
                          : 'bg-neonBlue text-black hover:bg-cyan-400 hover:scale-105'}
                    `}
                  >
                    {processing ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      `Pay $${selectedTier && selectedTier !== 'FREE' ? plans[selectedTier].price : 0} & Upgrade`
                    )}
                  </button>
                  <p className="text-xs text-center text-gray-600 mt-4">
                    <span className="flex items-center justify-center gap-2">
                       Secured by <span className="font-bold text-white">Stripe</span> (Mock)
                    </span>
                  </p>
               </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingModal;
