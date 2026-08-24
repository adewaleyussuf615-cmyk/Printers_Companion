import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, Lock, User, Phone, MapPin, Building2, 
  Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight,
  Printer, Search, ShoppingBag, Heart
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import BrandLogo from '../components/BrandLogo';

const SignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    state: '',
    city: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Nigerian states list
  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa',
    'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
    'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
    'FCT Abuja'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.state) {
      newErrors.state = 'Please select your state';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
          data: {
            full_name: formData.fullName,
            state: formData.state,
            city: formData.city,
            role: 'buyer'
          }
        }
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // A database trigger creates the profiles row automatically from the
        // metadata above — no manual insert needed here.

        // Store some basic info in localstorage for backward compatibility
        localStorage.setItem('printwise_user', JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          state: formData.state,
          city: formData.city
        }));

        navigate('/verify-email');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      const errorMessage = typeof err?.message === 'string' ? err.message.trim() : '';
      const isEmailDeliveryError = err?.name === 'AuthRetryableFetchError' || errorMessage === '{}';
      setErrors(prev => ({
        ...prev,
        submit: isEmailDeliveryError
          ? 'Account creation could not send the confirmation email. Please try again later or contact support.'
          : errorMessage || 'Failed to sign up'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#1E293B] flex flex-col justify-between">
      {/* Header with Logo */}
      <header className="bg-white border-b border-[#E2E8F0] py-4 px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <BrandLogo />
          <Link to="/login" className="text-sm font-semibold text-[#0B1F3A] hover:text-[#E53935] transition-colors font-display">
            Sign In
          </Link>
        </div>
      </header>

      <div className="max-w-6xl w-full mx-auto px-4 py-12 flex-1 flex items-center">
        <div className="grid md:grid-cols-12 gap-12 items-center w-full">
          
          {/* Left Side - Benefits/Info Section */}
          <div className="hidden md:block md:col-span-5 space-y-8">
            <div>
              <h1 className="text-4xl font-extrabold font-display tracking-tight text-[#0B1F3A] mb-4">
                Redefine Your <span className="text-[#E53935]">Print Supply</span>
              </h1>
              <p className="text-slate-600 text-base leading-relaxed">
                Connect directly with premium paper merchants, analyze regional price summaries, and purchase materials with extreme confidence.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 text-[#00C2FF]">
                  <Search className="w-5 h-5 text-[#0B1F3A]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Product Discovery</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Filter paper and cardstock by exact GSM, finishes, and specific sizes.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 text-[#E53935]">
                  <ShoppingBag className="w-5 h-5 text-[#E53935]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Price Intelligence Summary</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Access automated regional high, low, and average price insights.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 text-emerald-600">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Fintech payment match</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Fast, offline ledger payment verification via receipt upload.</p>
                </div>
              </div>
            </div>

            {/* Trust Badge */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-[#E2E8F0]">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm text-slate-800 font-display">Trusted Printing Network</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Empowering independent printers and large press houses across Nigeria to streamline operations and save millions.
              </p>
            </div>
          </div>

          {/* Right Side - Sign Up Form */}
          <div className="md:col-span-7 bg-white rounded-2xl shadow-md p-8 border border-[#E2E8F0]">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold font-display tracking-tight text-[#0B1F3A]">Create buyer account</h2>
              <p className="text-slate-500 text-sm mt-1">Get instant access to top merchant paper listings</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none transition-all text-sm ${
                      errors.fullName ? 'border-[#E53935] bg-red-50/50' : 'border-[#E2E8F0] focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/10'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-xs text-[#E53935] flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none transition-all text-sm ${
                      errors.email ? 'border-[#E53935] bg-red-50/50' : 'border-[#E2E8F0] focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/10'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-[#E53935] flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                  </p>
                )}
              </div>

              {/* State & City - Two columns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    State *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none appearance-none bg-white text-sm ${
                        errors.state ? 'border-[#E53935] bg-red-50/50' : 'border-[#E2E8F0] focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/10'
                      }`}
                    >
                      <option value="">Select state</option>
                      {nigerianStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  {errors.state && (
                    <p className="mt-1 text-xs text-[#E53935] font-medium">{errors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    City
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Ikeja"
                      className="w-full pl-11 pr-4 py-3 border border-[#E2E8F0] focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/10 rounded-xl outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 chars"
                      className={`w-full pl-11 pr-12 py-3 border rounded-xl outline-none transition-all text-sm ${
                        errors.password ? 'border-[#E53935] bg-red-50/50' : 'border-[#E2E8F0] focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-[#E53935] flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Retype password"
                      className={`w-full pl-11 pr-12 py-3 border rounded-xl outline-none transition-all text-sm ${
                        errors.confirmPassword ? 'border-[#E53935] bg-red-50/50' : 'border-[#E2E8F0] focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-[#E53935] flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-[#E53935] rounded border-slate-300 focus:ring-[#E53935]"
                />
                <label htmlFor="terms" className="text-xs text-slate-500 leading-tight">
                  I agree to the <a href="#" className="text-[#0B1F3A] font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-[#0B1F3A] font-bold hover:underline">Privacy Policy</a>.
                </label>
              </div>
              {errors.agreeTerms && (
                <p className="text-xs text-[#E53935] font-medium">{errors.agreeTerms}</p>
              )}

              {errors.submit && (
                <div className="bg-red-50 p-3 rounded-xl flex items-center gap-2 text-[#E53935] border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-semibold">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#0B1F3A] hover:bg-[#16365C] text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed font-display tracking-wide mt-4"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Buyer Account</span>
                    <ArrowRight className="w-4 h-4 text-[#00C2FF]" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2E8F0]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider text-slate-400">
                <span className="px-3 bg-white font-semibold">Already registered?</span>
              </div>
            </div>

            {/* Login Link */}
            <p className="text-center text-sm text-slate-500">
              Have an account?{' '}
              <Link to="/login" className="text-[#0B1F3A] font-extrabold hover:underline">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Printers Companion. Secure payments & buyer protection guaranteed.</p>
      </footer>
    </div>
  );
};

export default SignUp;
