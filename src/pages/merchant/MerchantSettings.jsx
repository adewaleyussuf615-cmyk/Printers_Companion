import React, { useState, useEffect } from 'react';
import { Store, Mail, Phone, MapPin, User, Save, Edit, Eye, EyeOff, Loader, Camera } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { uploadProfileImage } from '../../services/uploadService';

const MerchantSettings = ({ merchantId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [ownerId, setOwnerId] = useState(null);
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    state: '',
    city: '',
    contactPerson: '',
    deliveryEnabled: true,
    subscriptionPlan: 'basic',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (merchantId) {
      fetchMerchantData();
    }
  }, [merchantId]);

  const fetchMerchantData = async () => {
    setLoading(true);
    try {
      // Fetch merchant data from merchants table
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', merchantId)
        .single();

      if (merchantError) throw merchantError;

      // Owner's name/phone live on their profile row, not a "users" table.
      // Email isn't stored on any table — it comes from the auth session.
      const [{ data: profileData, error: profileError }, { data: { user: authUser } }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, phone, avatar_url')
          .eq('id', merchantData.owner_id)
          .single(),
        supabase.auth.getUser()
      ]);

      if (profileError) throw profileError;
      setOwnerId(merchantData.owner_id);
      setProfileImage(profileData?.avatar_url || null);

      setFormData({
        businessName: merchantData?.business_name || '',
        email: authUser?.email || '',
        phone: merchantData?.phone || '',
        address: merchantData?.address || '',
        state: '',
        city: merchantData?.city || '',
        contactPerson: profileData?.full_name || '',
        deliveryEnabled: true,
        subscriptionPlan: 'basic',
        password: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error fetching merchant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !ownerId) return;
    setUploadingImage(true);
    try {
      const avatarUrl = await uploadProfileImage(file, ownerId);
      const { error } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', ownerId);
      if (error) throw error;
      setProfileImage(avatarUrl);
    } catch (error) {
      console.error('Error uploading merchant profile image:', error);
      alert(error.message || 'Unable to upload profile image.');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update merchants table (only columns that actually exist on it —
      // there's no state/delivery_enabled/subscription_plan column yet)
      const { data: merchantRow, error: merchantFetchError } = await supabase
        .from('merchants')
        .select('owner_id')
        .eq('id', merchantId)
        .single();
      if (merchantFetchError) throw merchantFetchError;

      const { error: merchantError } = await supabase
        .from('merchants')
        .update({
          business_name: formData.businessName,
          city: formData.city,
          phone: formData.phone,
          address: formData.address
        })
        .eq('id', merchantId);

      if (merchantError) throw merchantError;

      // Update the owner's profile (name lives on profiles, not a "users" table)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: formData.contactPerson })
        .eq('id', merchantRow.owner_id);

      if (profileError) throw profileError;

      // Email changes go through Supabase Auth directly (it triggers a
      // confirmation email to the new address), not a table column.
      const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
      if (formData.email && formData.email !== currentAuthUser?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: formData.email });
        if (emailError) throw emailError;
      }

      // Update password if provided
      if (formData.newPassword && formData.newPassword === formData.confirmPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });
        if (passwordError) throw passwordError;
      }

      alert('Settings saved successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin" style={{ color: '#E53935' }} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#2B2B2B' }}>Settings</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          style={{ backgroundColor: isEditing ? '#27AE60' : '#E53935', color: 'white' }}
        >
          {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          {isEditing ? (saving ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border p-6 flex items-center gap-4" style={{ borderColor: '#E0E0E0' }}>
          <label className="relative w-20 h-20 rounded-full bg-[#0B1F3A] flex items-center justify-center text-white text-xl font-bold overflow-hidden cursor-pointer">
            {profileImage ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-8 h-8" />}
            <span className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"><Camera className="w-5 h-5" /></span>
            <input type="file" accept="image/*" onChange={handleProfileImage} disabled={uploadingImage} className="sr-only" />
          </label>
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Registered contact</p>
            <h2 className="text-lg font-bold" style={{ color: '#2B2B2B' }}>{formData.contactPerson || 'Registered user'}</h2>
            <p className="text-xs text-slate-500 mt-1">{uploadingImage ? 'Uploading image...' : 'Select the photo to update your profile image.'}</p>
          </div>
        </div>

        {/* Business Info */}
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E0E0E0' }}>
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: '#2B2B2B' }}>
            <Store className="w-5 h-5" style={{ color: '#00C2FF' }} />
            Business Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Business Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg" style={{ color: '#2B2B2B' }}>{formData.businessName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg flex items-center gap-2" style={{ color: '#2B2B2B' }}>
                  <Mail className="w-4 h-4" style={{ color: '#A0A0A0' }} />
                  {formData.email}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg flex items-center gap-2" style={{ color: '#2B2B2B' }}>
                  <Phone className="w-4 h-4" style={{ color: '#A0A0A0' }} />
                  {formData.phone}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Address</label>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg flex items-center gap-2" style={{ color: '#2B2B2B' }}>
                  <MapPin className="w-4 h-4" style={{ color: '#A0A0A0' }} />
                  {formData.address || 'Not specified'}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>State</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all"
                    style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                  />
                ) : (
                  <p className="p-3 bg-gray-50 rounded-lg" style={{ color: '#2B2B2B' }}>{formData.state || 'Not specified'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>City</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all"
                    style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                  />
                ) : (
                  <p className="p-3 bg-gray-50 rounded-lg" style={{ color: '#2B2B2B' }}>{formData.city || 'Not specified'}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium" style={{ color: '#2B2B2B' }}>Delivery Available</label>
              {isEditing ? (
                <button
                  onClick={() => setFormData(prev => ({ ...prev, deliveryEnabled: !prev.deliveryEnabled }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${formData.deliveryEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.deliveryEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              ) : (
                <span className={`px-2 py-1 rounded-full text-xs ${formData.deliveryEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {formData.deliveryEnabled ? 'Yes' : 'No'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Security - Only show when editing */}
        {isEditing && (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E0E0E0' }}>
            <h2 className="font-bold mb-4" style={{ color: '#2B2B2B' }}>Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all pr-12"
                    style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
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
                <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantSettings;
