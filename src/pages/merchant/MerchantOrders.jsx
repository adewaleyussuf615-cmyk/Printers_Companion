import React, { useState, useEffect } from 'react';
import { Package, MapPin, ChevronDown, ChevronUp, Eye, CheckCircle, XCircle, Download, Loader } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const MerchantOrders = ({ merchantId }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orders, setOrders] = useState({ pending: [], verified: [], rejected: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (merchantId) {
      fetchOrders();
    }
  }, [merchantId]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const pending = [];
      const verified = [];
      const rejected = [];

      (data || []).forEach(order => {
        if (order.order_status === 'pending') {
          pending.push({ ...order, status: order.order_status });
        } else if (order.order_status === 'confirmed' || order.payment_status === 'paid') {
          verified.push({ ...order, status: 'verified' });
        } else if (order.order_status === 'rejected') {
          rejected.push({ ...order, status: 'rejected' });
        } else {
          pending.push({ ...order, status: order.order_status });
        }
      });

      setOrders({ pending, verified, rejected });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: 'confirmed', payment_status: 'paid', updated_at: new Date() })
        .eq('id', orderId);
      
      if (error) throw error;
      await fetchOrders();
      setExpandedOrder(null);
    } catch (error) {
      console.error('Error verifying order:', error);
      alert('Failed to verify order. Please try again.');
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: 'rejected', payment_status: 'failed', updated_at: new Date() })
        .eq('id', orderId);
      
      if (error) throw error;
      await fetchOrders();
      setExpandedOrder(null);
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Failed to reject order. Please try again.');
    }
  };

  const tabs = ['pending', 'verified', 'rejected'];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return { text: 'Pending Verification', color: '#E53935', bg: '#FFEBEE' };
      case 'verified':
        return { text: 'Payment Verified', color: '#27AE60', bg: '#E8F5E9' };
      case 'rejected':
        return { text: 'Rejected', color: '#A0A0A0', bg: '#F5F5F5' };
      default:
        return { text: status, color: '#2B2B2B', bg: '#F7F7F5' };
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin" style={{ color: '#E53935' }} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6" style={{ color: '#2B2B2B' }}>Orders</h1>

      <div className="flex gap-2 mb-6 border-b" style={{ borderColor: '#E0E0E0' }}>
        {tabs.map((tab) => {
          const status = getStatusBadge(tab);
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 text-[#E53935]'
                  : 'text-[#A0A0A0]'
              }`}
              style={{ borderColor: activeTab === tab ? '#E53935' : 'transparent' }}
            >
              {tab}
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: '#F7F7F5', color: '#2B2B2B' }}>
                {orders[tab].length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {orders[activeTab].length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-3" style={{ color: '#A0A0A0' }} />
            <p style={{ color: '#A0A0A0' }}>No {activeTab} orders</p>
          </div>
        ) : (
          orders[activeTab].map((order) => {
            const status = getStatusBadge(order.status);
            const isExpanded = expandedOrder === order.id;
            
            return (
              <div key={order.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E0E0E0' }}>
                <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleExpand(order.id)}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5" style={{ color: '#00C2FF' }} />
                          <span className="font-bold" style={{ color: '#2B2B2B' }}>{order.order_number}</span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: status.bg, color: status.color }}>
                          {status.text}
                        </span>
                      </div>
                      <p className="font-medium" style={{ color: '#2B2B2B' }}>{order.product_name}</p>
                      <p className="text-sm flex items-center gap-1 mt-1" style={{ color: '#A0A0A0' }}>
                        <MapPin className="w-3 h-3" /> {order.delivery_address || 'Not specified'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg" style={{ color: '#E53935' }}>₦{order.total_amount?.toLocaleString()}</p>
                      <p className="text-xs" style={{ color: '#A0A0A0' }}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      <div className="mt-1">
                        {isExpanded ? 
                          <ChevronUp className="w-5 h-5" style={{ color: '#A0A0A0' }} /> : 
                          <ChevronDown className="w-5 h-5" style={{ color: '#A0A0A0' }} />
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t p-4 space-y-4 animate-in slide-in-from-top-2" style={{ borderColor: '#E0E0E0', backgroundColor: '#F7F7F5' }}>
                    <div className="bg-white rounded-lg p-4">
                      <h3 className="font-bold mb-3" style={{ color: '#2B2B2B' }}>Order Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span style={{ color: '#A0A0A0' }}>Product</span>
                          <span className="font-medium" style={{ color: '#2B2B2B' }}>{order.product_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: '#A0A0A0' }}>Quantity</span>
                          <span style={{ color: '#2B2B2B' }}>{order.quantity} reams</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: '#A0A0A0' }}>Unit Price</span>
                          <span style={{ color: '#2B2B2B' }}>₦{order.unit_price?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t" style={{ borderColor: '#E0E0E0' }}>
                          <span className="font-bold" style={{ color: '#2B2B2B' }}>Total Price</span>
                          <span className="font-bold text-lg" style={{ color: '#E53935' }}>₦{order.total_amount?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {order.status === 'pending' && (
                      <div className="bg-white rounded-lg p-4">
                        <h3 className="font-bold mb-3" style={{ color: '#2B2B2B' }}>Payment Verification</h3>
                        {order.payment_proof ? (
                          <div className="mb-4">
                            <p className="text-sm mb-2" style={{ color: '#2B2B2B' }}>Payment proof uploaded:</p>
                            <button className="text-sm flex items-center gap-2 px-4 py-2 border rounded-lg" style={{ borderColor: '#E0E0E0' }}>
                              <Download className="w-4 h-4" />
                              Download Payment Proof
                            </button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-lg p-4 text-center mb-4" style={{ borderColor: '#E0E0E0' }}>
                            <p className="text-sm" style={{ color: '#A0A0A0' }}>No payment proof uploaded yet</p>
                            <p className="text-xs mt-1" style={{ color: '#A0A0A0' }}>Awaiting customer payment confirmation</p>
                          </div>
                        )}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleVerifyOrder(order.id)}
                            className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-white transition-colors"
                            style={{ backgroundColor: '#27AE60' }}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark as Verified
                          </button>
                          <button
                            onClick={() => handleRejectOrder(order.id)}
                            className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            style={{ border: '1px solid #E0E0E0', color: '#E53935', backgroundColor: 'white' }}
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {order.status === 'verified' && (
                      <div className="bg-white rounded-lg p-4">
                        <h3 className="font-bold mb-3" style={{ color: '#2B2B2B' }}>Payment Verified</h3>
                        <div className="flex gap-3">
                          <button className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-white transition-colors" style={{ backgroundColor: '#00C2FF' }}>
                            <Download className="w-4 h-4" />
                            Download Invoice
                          </button>
                          <button className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors" style={{ border: '1px solid #E0E0E0', color: '#2B2B2B', backgroundColor: 'white' }}>
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MerchantOrders;
