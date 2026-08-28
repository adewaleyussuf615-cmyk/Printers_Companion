import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import BrandLogo from '../components/BrandLogo';
import logoMark from '../assets/logo-mark.png';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) throw signInError;

      // Verify that this user has the 'buyer' role
      const { data: userData, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (roleError) {
        // If there's an error getting user info, they might just be a buyer with a missing profile
        console.warn('Could not fetch user profile role:', roleError);
        navigate('/marketplace');
        return;
      }

      if (userData?.role === 'merchant') {
        setError('This account is registered as a merchant. Please use the Merchant Login page.');
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      if (!data.user.email_confirmed_at) {
        navigate('/verify-email');
        return;
      }

      navigate('/verify-whatsapp', { state: { showInstallPrompt: true } });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#1E293B] flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] py-4 px-6 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <BrandLogo size="md" />
          <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">Buyer Access</span>
        </div>
      </header>

      {/* Main Content Card */}
      <div className="max-w-md w-full mx-auto px-4 py-16 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-md p-8 border border-[#E2E8F0]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white mb-3 shadow-sm border border-slate-100 overflow-hidden">
              <img src={logoMark} alt="" aria-hidden="true" className="w-10 h-10 rounded-full object-cover" />
            </div>
            <h2 className="text-2xl font-bold font-display tracking-tight text-[#0B1F3A]">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to search & order paper stocks</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 border border-[#E2E8F0] rounded-xl focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/10 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-12 py-3 border border-[#E2E8F0] rounded-xl focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/10 outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 p-3 rounded-xl flex items-start gap-2 border border-red-100">
                <AlertCircle className="w-5 h-5 text-[#E53935] shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#0B1F3A] hover:bg-[#16365C] text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed font-display tracking-wide"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#00C2FF]" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E2E8F0]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider text-slate-400">
              <span className="px-3 bg-white font-semibold">New to Printers Companion?</span>
            </div>
          </div>

          <Link
            to="/signup"
            className="block w-full py-3 text-center border-2 border-[#0B1F3A] text-[#0B1F3A] hover:bg-[#0B1F3A]/5 font-bold rounded-xl transition-all font-display"
          >
            Create Buyer Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Printers Companion. Secure payments & buyer protection guaranteed.</p>
      </footer>
    </div>
  );
};

export default Login;
