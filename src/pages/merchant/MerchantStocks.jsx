import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Search, X, Check, Upload, Camera, Loader, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { uploadProductImage, compressImage } from '../../services/uploadService';

const MerchantStocks = ({ merchantId }) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    gsm: '',
    size: '700×1000mm',
    price: '',
    quantity: '',
    delivery: 'Yes',
    description: ''
  });

  useEffect(() => {
    if (merchantId) {
      loadStocks();
    }
  }, [merchantId]);

  const loadStocks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setStocks(data || []);
    } catch (error) {
      console.error('Error loading stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddStock = async () => {
    if (!formData.name || !formData.price || !formData.quantity) return;
    
    setUploading(true);
    
    try {
      let imageUrl = null;
      if (imageFile) {
        const compressedImage = await compressImage(imageFile);
        imageUrl = await uploadProductImage(compressedImage, Date.now());
      }
      
      const newStock = {
        merchant_id: merchantId,
        name: formData.name,
        gsm: parseInt(formData.gsm) || null,
        size: formData.size,
        price: parseInt(formData.price),
        quantity: parseInt(formData.quantity),
        delivery: formData.delivery,
        description: formData.description,
        image_url: imageUrl
      };
      
      const { data, error } = await supabase
        .from('stocks')
        .insert([newStock])
        .select();
      
      if (error) throw error;
      if (data) {
        setStocks([data[0], ...stocks]);
      }
      resetForm();
      setShowAddForm(false);
      setImagePreview(null);
      setImageFile(null);
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleEditStock = (stock) => {
    setEditingStock(stock);
    setFormData({
      name: stock.name,
      gsm: stock.gsm || '',
      size: stock.size || '700×1000mm',
      price: stock.price,
      quantity: stock.quantity,
      delivery: stock.delivery || 'Yes',
      description: stock.description || ''
    });
    setImagePreview(stock.image_url);
    setImageFile(null);
    setShowAddForm(true);
  };

  const handleUpdateStock = async () => {
    if (!editingStock) return;
    
    setUploading(true);
    
    try {
      let imageUrl = editingStock.image_url;
      if (imageFile) {
        const compressedImage = await compressImage(imageFile);
        imageUrl = await uploadProductImage(compressedImage, editingStock.id);
      }
      
      const updatedData = {
        name: formData.name,
        gsm: parseInt(formData.gsm) || null,
        size: formData.size,
        price: parseInt(formData.price),
        quantity: parseInt(formData.quantity),
        delivery: formData.delivery,
        description: formData.description,
        image_url: imageUrl
      };
      
      const { data, error } = await supabase
        .from('stocks')
        .update(updatedData)
        .eq('id', editingStock.id)
        .select();
      
      if (error) throw error;
      if (data) {
        setStocks(stocks.map(stock => stock.id === editingStock.id ? data[0] : stock));
      }
      resetForm();
      setShowAddForm(false);
      setEditingStock(null);
      setImagePreview(null);
      setImageFile(null);
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStock = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const { error } = await supabase
          .from('stocks')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        setStocks(stocks.filter(stock => stock.id !== id));
      } catch (error) {
        console.error('Error deleting stock:', error);
        alert('Failed to delete stock. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      gsm: '',
      size: '700×1000mm',
      price: '',
      quantity: '',
      delivery: 'Yes',
      description: ''
    });
    setEditingStock(null);
    setImagePreview(null);
    setImageFile(null);
  };

  const filteredStocks = stocks.filter(stock =>
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin" style={{ color: '#E53935' }} />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#2B2B2B' }}>Stocks List</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 rounded-lg flex items-center gap-2 text-white transition-colors"
          style={{ backgroundColor: '#E53935' }}
        >
          <Plus className="w-4 h-4" />
          Add Stock
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0A0A0' }} />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all"
          style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
        />
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border mb-6 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: '#E0E0E0', backgroundColor: '#F7F7F5' }}>
            <h2 className="font-bold" style={{ color: '#2B2B2B' }}>
              {editingStock ? 'Edit Stock' : 'Add New Stock'}
            </h2>
            <button onClick={() => { setShowAddForm(false); resetForm(); }} className="p-1 hover:bg-gray-200 rounded-full">
              <X className="w-5 h-5" style={{ color: '#A0A0A0' }} />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                  placeholder="e.g., Art Paper Gloss"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>GSM</label>
                <input
                  type="number"
                  name="gsm"
                  value={formData.gsm}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                  placeholder="150"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Price per ream (₦) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                  placeholder="42000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Quantity (reams) *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                  placeholder="500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Delivery Available?</label>
                <select
                  name="delivery"
                  value={formData.delivery}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-xl outline-none"
                  style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No (Pickup only)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Size</label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all"
                  style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                  placeholder="700×1000mm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all"
                style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                placeholder="Product description..."
              />
            </div>
            
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#2B2B2B' }}>Product Image</label>
              <div 
                className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: '#E0E0E0' }}
                onClick={() => document.getElementById('image-upload').click()}
              >
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-32 rounded-lg object-cover" />
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setImagePreview(null); 
                        setImageFile(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Camera className="w-8 h-8 mx-auto mb-2" style={{ color: '#A0A0A0' }} />
                    <p className="text-sm" style={{ color: '#A0A0A0' }}>Click to upload product image</p>
                    <p className="text-xs mt-1" style={{ color: '#A0A0A0' }}>JPG, PNG or GIF (max 2MB)</p>
                  </>
                )}
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowAddForm(false); resetForm(); }}
                className="flex-1 py-3 border rounded-xl font-medium transition-colors"
                style={{ borderColor: '#E0E0E0', color: '#2B2B2B' }}
              >
                Cancel
              </button>
              <button
                onClick={editingStock ? handleUpdateStock : handleAddStock}
                disabled={uploading}
                className="flex-1 py-3 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#E53935' }}
              >
                {uploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingStock ? 'Update Stock' : 'Add Stock'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E0E0E0' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: '#F7F7F5' }}>
              <tr className="border-b" style={{ borderColor: '#E0E0E0' }}>
                <th className="p-4 text-left font-medium" style={{ color: '#2B2B2B' }}>Image</th>
                <th className="p-4 text-left font-medium" style={{ color: '#2B2B2B' }}>Product</th>
                <th className="p-4 text-left font-medium" style={{ color: '#2B2B2B' }}>GSM</th>
                <th className="p-4 text-left font-medium" style={{ color: '#2B2B2B' }}>Price/ream</th>
                <th className="p-4 text-left font-medium" style={{ color: '#2B2B2B' }}>Quantity</th>
                <th className="p-4 text-left font-medium" style={{ color: '#2B2B2B' }}>Delivery</th>
                <th className="p-4 text-left font-medium" style={{ color: '#2B2B2B' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#E0E0E0' }}>
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center" style={{ color: '#A0A0A0' }}>
                    No products found. Click "Add Stock" to create your first product.
                  </td>
                  </tr>
              ) : (
                filteredStocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      {stock.image_url ? (
                        <img src={stock.image_url} alt={stock.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F7F7F5' }}>
                          <Package className="w-6 h-6" style={{ color: '#A0A0A0' }} />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span style={{ color: '#2B2B2B' }}>{stock.name}</span>
                    </td>
                    <td className="p-4" style={{ color: '#2B2B2B' }}>{stock.gsm}gsm</td>
                    <td className="p-4 font-bold" style={{ color: '#E53935' }}>₦{stock.price?.toLocaleString()}</td>
                    <td className="p-4" style={{ color: '#2B2B2B' }}>{stock.quantity} reams</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${stock.delivery === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {stock.delivery}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditStock(stock)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" style={{ color: '#00C2FF' }} />
                        </button>
                        <button onClick={() => handleDeleteStock(stock.id)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" style={{ color: '#E53935' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MerchantStocks;
