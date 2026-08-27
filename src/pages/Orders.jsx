import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Loader, Package, XCircle } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const tabs = [
  { key: 'all', label: 'All orders' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'declined', label: 'Declined' }
];

const getOrderState = (order) => {
  const orderStatus = String(order.status || order.order_status || '').toLowerCase();
  const paymentStatus = String(order.payment?.status || order.payment_status || '').toLowerCase();

  if (['cancelled', 'canceled', 'rejected', 'declined'].includes(orderStatus) || ['rejected', 'declined', 'failed'].includes(paymentStatus)) {
    return 'declined';
  }
  if (['confirmed', 'completed', 'delivered'].includes(orderStatus) || ['paid', 'verified', 'completed'].includes(paymentStatus)) {
    return 'completed';
  }
  return 'pending';
};

const statusDetails = {
  completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  pending: { label: 'Pending', icon: Clock3, className: 'bg-amber-50 text-amber-700 border-amber-100' },
  declined: { label: 'Declined', icon: XCircle, className: 'bg-red-50 text-red-700 border-red-100' }
};

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items ( quantity, unit_price, inventory_id, products ( name ) ),
            payments ( status, created_at ),
            merchants ( business_name )
          `)
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        setOrders((data || []).map((order) => {
          const firstItem = (order.order_items || [])[0];
          const latestPayment = (order.payments || []).slice().sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          )[0] || null;
          return {
            ...order,
            displayNumber: order.order_number || `ORD-${order.id.slice(0, 8).toUpperCase()}`,
            productName: firstItem?.products?.name || order.product_name || 'Paper order',
            quantity: firstItem?.quantity || order.quantity || 0,
            merchantName: order.merchants?.business_name || order.merchant_name || 'Unknown supplier',
            amount: Number(order.total ?? order.total_amount ?? 0),
            payment: latestPayment,
            state: getOrderState({ ...order, payment: latestPayment })
          };
        }));
      } catch (fetchError) {
        console.error('Error fetching orders:', fetchError);
        setError('Orders could not be loaded. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  const visibleOrders = activeTab === 'all'
    ? orders
    : orders.filter((order) => order.state === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6]">
        <Loader className="w-8 h-8 animate-spin text-[#0B1F3A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#1E293B] pb-24 font-sans">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#E53935]">Purchase history</p>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-[#0B1F3A] mt-1">My orders</h1>
          <p className="text-sm text-slate-500 mt-2">Track every paper and board order in one place.</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-5" role="tablist" aria-label="Order status">
          {tabs.map((tab) => {
            const count = tab.key === 'all' ? orders.length : orders.filter((order) => order.state === tab.key).length;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors ${activeTab === tab.key ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]' : 'bg-white text-slate-600 border-[#E2E8F0]'}`}
              >
                {tab.label} <span className="ml-1 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">{error}</div>
        ) : visibleOrders.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10 text-center">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <h2 className="font-bold text-[#0B1F3A]">No {activeTab === 'all' ? '' : `${activeTab} `}orders yet</h2>
            <p className="text-sm text-slate-500 mt-1">Your purchases will appear here after you place an order.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleOrders.map((order) => {
              const details = statusDetails[order.state];
              const StatusIcon = details.icon;
              return (
                <article key={order.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold font-mono text-slate-400">{order.displayNumber}</p>
                      <h2 className="font-bold text-[#0B1F3A] mt-1 truncate">{order.productName}</h2>
                      <p className="text-xs text-slate-500 mt-1">{order.quantity} {order.quantity === 1 ? 'unit' : 'units'} · {order.merchantName}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 border rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${details.className}`}>
                      <StatusIcon className="w-3 h-3" /> {details.label}
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-4 mt-4 pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Placed</p>
                      <p className="text-xs text-slate-600 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className="font-black text-[#E53935]">₦{order.amount.toLocaleString()}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Orders;
