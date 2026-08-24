import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Building, ChevronDown, ArrowRight, Printer, Shield, X, Check } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

const LOCATIONS = {
  Lagos: ['Ikeja', 'Shomolu', 'Mushin', 'Lagos Island', 'Yaba'],
  Abuja: ['Wuse', 'Garki', 'Utako', 'Maitama'],
  Rivers: ['Port Harcourt', 'Obio-Akpor'],
  Oyo: ['Ibadan (Bodija)', 'Ibadan (Dugbe)']
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [selectedState, setSelectedState] = useState('Lagos');
  const [selectedCity, setSelectedCity] = useState('Ikeja');
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [showRoleDrawer, setShowRoleDrawer] = useState(false);
  const [selectedRole, setSelectedRole] = useState('buyer'); // 'buyer' or 'merchant'

  const handleGetStarted = () => {
    // Save selections to localStorage
    localStorage.setItem('user_location_state', selectedState);
    localStorage.setItem('user_location_city', selectedCity);
    // Show role selection sheet
    setShowRoleDrawer(true);
  };

  const handleEnterApp = () => {
    if (selectedRole === 'buyer') {
      navigate('/marketplace');
    } else {
      navigate('/merchant/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-0 sm:p-6 md:p-8 font-sans overflow-x-hidden relative">
      
      {/* Background Watermark (Oversized Concentric Circles) */}
      <div className="absolute right-[-20%] top-[15%] w-[90%] sm:w-[500px] aspect-square pointer-events-none select-none z-0">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#143F8F] opacity-[0.04]">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.75" />
          <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.75" />
          <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="0.75" />
          <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="0.75" />
          <circle cx="50" cy="50" r="5" fill="currentColor" />
        </svg>
      </div>

      {/* Main iPhone 16 Pro Responsive Canvas Container */}
      <div className="w-full sm:max-w-[430px] sm:min-h-[880px] sm:rounded-[48px] sm:border-[8px] sm:border-[#0F172A] bg-white relative overflow-hidden flex flex-col justify-between shadow-[0_32px_80px_-16px_rgba(15,23,42,0.16)] z-10">
        
        {/* Top iOS Status Bar */}
        <div className="h-[44px] px-6 pt-3 flex items-center justify-between text-[14px] font-semibold text-[#0F172A] z-20">
          <span className="tracking-tight select-none">9:41</span>
          <div className="flex items-center gap-2">
            {/* Cellular Signal Strength Icon */}
            <svg className="w-[18px] h-[11px] text-[#0F172A]" fill="currentColor" viewBox="0 0 18 11">
              <rect x="0" y="8" width="2.5" height="3" rx="0.5" />
              <rect x="4.5" y="6" width="2.5" height="5" rx="0.5" />
              <rect x="9" y="3.5" width="2.5" height="7.5" rx="0.5" />
              <rect x="13.5" y="0.5" width="2.5" height="10.5" rx="0.5" />
            </svg>
            
            {/* WiFi Icon */}
            <svg className="w-[17px] h-[12px] text-[#0F172A]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 17 12">
              <path d="M1.5 3.5c4-4 10-4 14 0" />
              <path d="M4 6.5c2.5-2.5 6.5-2.5 9 0" />
              <path d="M6.5 9.5c1.2-1.2 2.8-1.2 4 0" />
              <circle cx="8.5" cy="11.5" r="0.5" fill="currentColor" />
            </svg>
            
            {/* Battery Icon */}
            <div className="w-[24px] h-[12px] rounded-[4px] border border-[#0F172A] p-[1.5px] flex items-center relative">
              <div className="h-full w-4/5 rounded-[2px] bg-[#0F172A]" />
              <div className="w-[1.5px] h-[4px] bg-[#0F172A] rounded-r-[1px] absolute right-[-2.5px] top-[3px]" />
            </div>
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 px-8 pt-8 pb-6 flex flex-col justify-between z-10">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <div className="ml-auto flex items-center gap-3 text-xs font-bold">
              <button type="button" onClick={() => navigate('/login')} className="text-[#143F8F] hover:text-[#0F306D]">Buyer Sign In</button>
              <button type="button" onClick={() => navigate('/signup')} className="text-[#F22A1D] hover:text-[#C51F16]">Sign Up</button>
            </div>
          </div>

          {/* Heading and Typography Section */}
          <div className="mt-[48px]">
            <span className="text-[12px] sm:text-[14px] font-bold text-[#143F8F] tracking-[0.25em] block mb-2 uppercase">
              WELCOME TO PC
            </span>
            
            <h1 className="text-[34px] sm:text-[40px] font-bold text-[#0F172A] leading-[1.1] tracking-tight font-sans">
              Find the best<br />
              printing materials<br />
              near you<span className="text-[#F22A1D] font-black inline-block ml-0.5">.</span>
            </h1>

            <div className="mt-[28px]">
              <p className="text-[15px] sm:text-[17px] text-[#4B5563] font-medium leading-relaxed">
                Get accurate prices, compare merchants<br />
                and place your order with confidence.
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="mt-[40px] space-y-[28px]">
            
            {/* Dropdown 1: Select State */}
            <div className="space-y-2 relative">
              <label className="block text-[13px] font-bold text-[#4B5563] tracking-wider uppercase font-sans">
                Select State
              </label>
              <button
                type="button"
                onClick={() => {
                  setStateDropdownOpen(!stateDropdownOpen);
                  setCityDropdownOpen(false);
                }}
                className="w-full h-[56px] px-5 bg-white border border-[#E7EBF2] rounded-[16px] flex items-center justify-between shadow-[0_4px_12px_rgba(15,23,42,0.02)] hover:border-[#143F8F]/40 active:scale-[0.99] transition-all text-left z-10 relative"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#143F8F]" strokeWidth={1.5} />
                  <span className="text-[16px] sm:text-[17px] font-semibold text-[#0F172A]">{selectedState}</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-[#94A3B8] transition-transform duration-200 ${stateDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
              </button>

              {stateDropdownOpen && (
                <div className="absolute left-0 right-0 top-[88px] bg-white border border-[#E7EBF2] rounded-[16px] shadow-[0_12px_32px_rgba(15,23,42,0.08)] z-30 py-2 max-h-[180px] overflow-y-auto">
                  {Object.keys(LOCATIONS).map((state) => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => {
                        setSelectedState(state);
                        setSelectedCity(LOCATIONS[state][0]);
                        setStateDropdownOpen(false);
                      }}
                      className={`w-full px-5 py-3 text-left text-[15px] font-medium hover:bg-[#FAFBFC] transition-colors flex items-center justify-between ${selectedState === state ? 'text-[#143F8F] bg-[#143F8F]/5 font-bold' : 'text-[#4B5563]'}`}
                    >
                      <span>{state}</span>
                      {selectedState === state && <Check className="w-4 h-4 text-[#143F8F]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown 2: Select City */}
            <div className="space-y-2 relative">
              <label className="block text-[13px] font-bold text-[#4B5563] tracking-wider uppercase font-sans">
                Select City
              </label>
              <button
                type="button"
                onClick={() => {
                  setCityDropdownOpen(!cityDropdownOpen);
                  setStateDropdownOpen(false);
                }}
                className="w-full h-[56px] px-5 bg-white border border-[#E7EBF2] rounded-[16px] flex items-center justify-between shadow-[0_4px_12px_rgba(15,23,42,0.02)] hover:border-[#143F8F]/40 active:scale-[0.99] transition-all text-left z-10 relative"
              >
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-[#143F8F]" strokeWidth={1.5} />
                  <span className="text-[16px] sm:text-[17px] font-semibold text-[#0F172A]">{selectedCity}</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-[#94A3B8] transition-transform duration-200 ${cityDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
              </button>

              {cityDropdownOpen && (
                <div className="absolute left-0 right-0 top-[88px] bg-white border border-[#E7EBF2] rounded-[16px] shadow-[0_12px_32px_rgba(15,23,42,0.08)] z-30 py-2 max-h-[180px] overflow-y-auto">
                  {LOCATIONS[selectedState].map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setSelectedCity(city);
                        setCityDropdownOpen(false);
                      }}
                      className={`w-full px-5 py-3 text-left text-[15px] font-medium hover:bg-[#FAFBFC] transition-colors flex items-center justify-between ${selectedCity === city ? 'text-[#143F8F] bg-[#143F8F]/5 font-bold' : 'text-[#4B5563]'}`}
                    >
                      <span>{city}</span>
                      {selectedCity === city && <Check className="w-4 h-4 text-[#143F8F]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Primary CTA Button */}
          <div className="mt-[44px]">
            <button
              type="button"
              onClick={handleGetStarted}
              className="w-full h-[64px] bg-[#143F8F] text-white rounded-[16px] flex items-center justify-between px-6 font-semibold text-[18px] sm:text-[20px] shadow-[0_8px_24px_rgba(20,63,143,0.18)] hover:bg-[#0F306D] active:scale-[0.98] transition-all cursor-pointer group"
            >
              <span className="flex-1 text-center pl-6">Get Started</span>
              <div className="w-[40px] h-[40px] rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-5 h-5 text-[#143F8F]" strokeWidth={2.5} />
              </div>
            </button>
          </div>

          {/* Pagination Indicators */}
          <div className="mt-[48px] flex justify-center items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#143F8F]" />
            <span className="w-2 h-2 rounded-full bg-[#E7EBF2]" />
            <span className="w-2 h-2 rounded-full bg-[#E7EBF2]" />
            <span className="w-2 h-2 rounded-full bg-[#E7EBF2]" />
          </div>

        </div>

        {/* Elegant Bottom Home Indicator Bar (iOS style) */}
        <div className="h-[34px] flex items-center justify-center pb-2 z-20 select-none">
          <div className="w-[134px] h-[5px] bg-[#0F172A] rounded-full" />
        </div>

        {/* Backdrop for Custom Role Selector Sheet */}
        {showRoleDrawer && (
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-[100] transition-opacity duration-300"
            onClick={() => setShowRoleDrawer(false)}
          >
            {/* The Bottom Drawer */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] border-t border-[#E7EBF2] p-6 pb-10 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] z-[101] transform transition-transform duration-300 animate-in slide-in-from-bottom"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grab handle */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[18px] font-bold text-[#0F172A]">Choose Workspace</h3>
                  <p className="text-[14px] text-slate-500 font-medium mt-0.5">Select how you want to enter the supply chain</p>
                </div>
                <button 
                  onClick={() => setShowRoleDrawer(false)}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Roles Toggles */}
              <div className="space-y-3 mb-6">
                
                {/* Print Buyer Option */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('buyer')}
                  className={`w-full p-4 rounded-xl border-2 text-left flex items-start gap-4 transition-all ${
                    selectedRole === 'buyer'
                      ? 'border-[#143F8F] bg-[#143F8F]/5'
                      : 'border-[#E7EBF2] hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selectedRole === 'buyer' ? 'bg-[#143F8F] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[15px] text-[#0F172A]">Continue as Print Buyer</h4>
                    <p className="text-slate-500 text-[12px] font-medium mt-0.5">Explore active ream stocks, compare regional prices, and order paper.</p>
                  </div>
                </button>

                {/* Paper Supplier Option */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('merchant')}
                  className={`w-full p-4 rounded-xl border-2 text-left flex items-start gap-4 transition-all ${
                    selectedRole === 'merchant'
                      ? 'border-[#143F8F] bg-[#143F8F]/5'
                      : 'border-[#E7EBF2] hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selectedRole === 'merchant' ? 'bg-[#143F8F] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[15px] text-[#0F172A]">Continue as Paper Supplier</h4>
                    <p className="text-slate-500 text-[12px] font-medium mt-0.5">List paper inventory, receive order notifications, and verify ledger payments.</p>
                  </div>
                </button>

              </div>

              {/* CTA Action in Drawer */}
              <button
                type="button"
                onClick={handleEnterApp}
                className="w-full h-[56px] bg-[#143F8F] text-white rounded-[16px] font-semibold text-[16px] sm:text-[18px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(20,63,143,0.15)] hover:bg-[#0F306D] transition-colors"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default LandingPage;
