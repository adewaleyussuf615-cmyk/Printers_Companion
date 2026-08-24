import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Mail, Lock, User, Phone, MapPin, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const normalizeNGPhone = (value) => {
  let n = value.replace(/\D/g, '');
  if (n.startsWith('0')) n = '234' + n.slice(1);
  if (!n.startsWith('234')) n = '234' + n;
  return '+' + n;
};

const MerchantSignup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
          data: {
            full_name: formData.contactName,
            phone: normalizeNGPhone(formData.phone),
            role: 'merchant'
          }
        }
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // The profiles row is created automatically by a database trigger from
        // the signUp metadata above (full_name, role). Phone isn't part of that
        // trigger, so set it explicitly here.
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            full_name: formData.contactName,
            phone: normalizeNGPhone(formData.phone),
            role: 'merchant'
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        // Create merchant record in merchants table
        const { error: merchantError } = await supabase
          .from('merchants')
          .insert([
            {
              owner_id: authData.user.id,
              business_name: formData.businessName,
              phone: normalizeNGPhone(formData.phone),
              address: formData.address,
              is_active: true
            }
          ]);

        if (merchantError) {
          console.error('Merchant record creation error:', merchantError);
        }

        // Always pass through email confirmation before WhatsApp verification.
        navigate('/verify-email');
      }
    } catch (err) {
      console.error('Merchant sign up error:', err);
      setError(err.message || 'Failed to register merchant');
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
          <h1 className="text-2xl font-bold" style={{ color: '#2B2B2B' }}>Merchant Sign Up</h1>
          <p className="text-sm mt-2" style={{ color: '#A0A0A0' }}>
            Sell paper and supplies to printers across Nigeria
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Business Name *</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0A0A0' }} />
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Your Business Name"
                className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all"
                style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Contact Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0A0A0' }} />
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="Your Full Name"
                className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all"
                style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Email Address *</label>
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
            <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Phone Number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0A0A0' }} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+234 801 234 5678"
                className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all"
                style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Business Address *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0A0A0' }} />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="City, State"
                className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all"
                style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0A0A0' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
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

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Confirm Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0A0A0' }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className="w-full pl-10 pr-12 py-3 border rounded-xl outline-none focus:ring-2 transition-all"
                style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" style={{ color: '#A0A0A0' }} /> : <Eye className="w-5 h-5" style={{ color: '#A0A0A0' }} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-xl flex items-center gap-2 text-red-600 border border-red-100 text-sm mt-2">
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-semibold rounded-xl transition-colors mt-4"
            style={{ backgroundColor: '#E53935' }}
          >
            {loading ? 'Creating account...' : 'Sign Up as Merchant'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: '#A0A0A0' }}>
          Already have a merchant account?{' '}
          <Link to="/merchant/login" className="font-medium" style={{ color: '#00C2FF' }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default MerchantSignup;
