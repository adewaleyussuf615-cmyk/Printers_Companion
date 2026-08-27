import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Printer, ArrowRight, Loader } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { supabase } from '../supabaseClient';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderNumber) {
      fetchOrderDetails();
    } else {
      // If no order number, redirect to marketplace
      navigate('/marketplace');
    }
  }, [orderNumber]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F7F5' }}>
        <Loader className="w-8 h-8 animate-spin" style={{ color: '#E53935' }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F7F5' }}>
        <div className="text-center">
          <p>Order not found</p>
          <button onClick={() => navigate('/marketplace')} className="mt-4 text-teal-600">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F7F7F5' }}>
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8" style={{ borderColor: '#E0E0E0' }}>
          {/* Success Animation */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#27AE60', opacity: 0.1 }}>
            <CheckCircle className="w-10 h-10" style={{ color: '#27AE60' }} />
          </div>
          
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#2B2B2B' }}>Order Confirmed!</h1>
          <p className="mb-6" style={{ color: '#A0A0A0' }}>Your order has been placed successfully.</p>
          
          <div className="rounded-xl p-4 mb-6 text-left" style={{ backgroundColor: '#F7F7F5' }}>
            <div className="flex justify-between mb-2">
              <span style={{ color: '#A0A0A0' }}>Order Number</span>
              <span className="font-mono font-bold" style={{ color: '#2B2B2B' }}>{order.order_number}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span style={{ color: '#A0A0A0' }}>Product</span>
              <span style={{ color: '#2B2B2B' }}>{order.product_name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span style={{ color: '#A0A0A0' }}>Quantity</span>
              <span style={{ color: '#2B2B2B' }}>{order.quantity} reams</span>
            </div>
            <div className="flex justify-between mb-2">
              <span style={{ color: '#A0A0A0' }}>Total Amount</span>
              <span className="font-bold" style={{ color: '#E53935' }}>₦{order.total_amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#A0A0A0' }}>Delivery to</span>
              <span style={{ color: '#2B2B2B' }}>{order.delivery_address}</span>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/profile')}
            className="w-full py-3 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            style={{ backgroundColor: '#E53935' }}
          >
            View Order Details
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => navigate('/marketplace')}
            className="w-full mt-3 py-3 border rounded-xl font-semibold transition-colors"
            style={{ borderColor: '#E0E0E0', color: '#2B2B2B', backgroundColor: 'white' }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default OrderConfirmation;
