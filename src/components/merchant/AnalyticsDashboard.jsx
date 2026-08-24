import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Package, Loader, Calendar } from 'lucide-react';
import { getMerchantAnalytics } from '../../services/analyticsService';

const AnalyticsDashboard = ({ merchantId }) => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (merchantId) {
      fetchAnalytics();
    }
  }, [merchantId, period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const data = await getMerchantAnalytics(merchantId, period);
    setAnalytics(data);
    setLoading(false);
  };

  const periods = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

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
        <h1 className="text-xl font-bold" style={{ color: '#2B2B2B' }}>Analytics</h1>
        
        {/* Period Selector */}
        <div className="flex gap-2 bg-white border rounded-lg p-1" style={{ borderColor: '#E0E0E0' }}>
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                period === p.value
                  ? 'bg-[#E53935] text-white'
                  : 'text-[#2B2B2B] hover:bg-gray-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E0E0E0' }}>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E5393520' }}>
              <DollarSign className="w-6 h-6" style={{ color: '#E53935' }} />
            </div>
            <span className="text-2xl font-bold" style={{ color: '#E53935' }}>
              ₦{analytics?.totalRevenue?.toLocaleString() || 0}
            </span>
          </div>
          <p className="font-medium" style={{ color: '#2B2B2B' }}>Total Revenue</p>
        </div>

        <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E0E0E0' }}>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00C2FF20' }}>
              <ShoppingBag className="w-6 h-6" style={{ color: '#00C2FF' }} />
            </div>
            <span className="text-2xl font-bold" style={{ color: '#00C2FF' }}>
              {analytics?.totalOrders || 0}
            </span>
          </div>
          <p className="font-medium" style={{ color: '#2B2B2B' }}>Total Orders</p>
        </div>

        <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E0E0E0' }}>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#27AE6020' }}>
              <TrendingUp className="w-6 h-6" style={{ color: '#27AE60' }} />
            </div>
            <span className="text-2xl font-bold" style={{ color: '#27AE60' }}>
              ₦{Math.round((analytics?.totalRevenue || 0) / (analytics?.totalOrders || 1)).toLocaleString()}
            </span>
          </div>
          <p className="font-medium" style={{ color: '#2B2B2B' }}>Average Order Value</p>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="bg-white rounded-xl border mb-8" style={{ borderColor: '#E0E0E0' }}>
        <div className="p-4 border-b" style={{ borderColor: '#E0E0E0' }}>
          <h2 className="font-bold" style={{ color: '#2B2B2B' }}>Orders by Status</h2>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {analytics?.ordersByStatus?.map((status, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: '#2B2B2B' }} className="capitalize">
                    {status.order_status}
                  </span>
                  <span style={{ color: '#2B2B2B' }}>{status.count} orders</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E0E0E0' }}>
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${(status.count / analytics.totalOrders) * 100}%`,
                      backgroundColor: status.order_status === 'pending' ? '#E53935' :
                                    status.order_status === 'confirmed' ? '#27AE60' :
                                    '#00C2FF'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl border" style={{ borderColor: '#E0E0E0' }}>
        <div className="p-4 border-b" style={{ borderColor: '#E0E0E0' }}>
          <h2 className="font-bold" style={{ color: '#2B2B2B' }}>Top Selling Products</h2>
        </div>
        <div className="divide-y" style={{ borderColor: '#E0E0E0' }}>
          {analytics?.topProducts?.length === 0 ? (
            <div className="p-8 text-center" style={{ color: '#A0A0A0' }}>
              No sales data available
            </div>
          ) : (
            analytics?.topProducts?.map((product, idx) => (
              <div key={idx} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium" style={{ color: '#2B2B2B' }}>{product.name}</p>
                  <p className="text-sm" style={{ color: '#A0A0A0' }}>{product.quantity} units sold</p>
                </div>
                <Package className="w-5 h-5" style={{ color: '#00C2FF' }} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
