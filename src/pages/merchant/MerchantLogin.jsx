import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const MerchantLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) throw signInError;

      // Check user role from profiles table
      const { data: userData, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (roleError) {
        console.warn('Could not fetch user profile role:', roleError);
        if (data.user.user_metadata?.role === 'merchant') {
          navigate('/merchant/dashboard');
          return;
        }
        throw new Error('Merchant profile is not ready yet. Please try again in a moment.');
      }

      if (userData?.role === 'buyer') {
        setError('This account is registered as a buyer. Please use the Buyer Login page.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (userData?.role !== 'merchant' && data.user.user_metadata?.role === 'merchant') {
        await supabase.from('profiles').update({ role: 'merchant' }).eq('id', data.user.id);
      } else if (userData?.role !== 'merchant') {
        throw new Error('This account is not registered as a merchant.');
      }

      navigate('/merchant/dashboard');
    } catch (err) {
      console.error('Merchant login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7F5' }}>
      <div className="max-w-md mx-auto px-4 py-12">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 mb-6" style={{ color: '#A0A0A0' }}>
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#E53935' }}>
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#2B2B2B' }}>Merchant Login</h1>
          <p className="text-sm mt-2" style={{ color: '#A0A0A0' }}>
            Sell paper and supplies to printers across Nigeria
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0A0A0' }} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="merchant@example.com"
                className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all"
                style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0A0A0' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full pl-10 pr-12 py-3 border rounded-xl outline-none focus:ring-2 transition-all"
                style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="w-5 h-5" style={{ color: '#A0A0A0' }} /> : <Eye className="w-5 h-5" style={{ color: '#A0A0A0' }} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-xl flex items-center gap-2 text-red-600 border border-red-100 text-sm">
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-semibold rounded-xl transition-colors"
            style={{ backgroundColor: '#E53935' }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: '#A0A0A0' }}>
          Don't have a merchant account?{' '}
          <Link to="/merchant/signup" className="font-medium" style={{ color: '#00C2FF' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default MerchantLogin;
