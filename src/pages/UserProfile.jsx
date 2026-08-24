import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, Phone, LogOut, Loader, ShoppingBag, Package, Star, Clock, CheckCircle2, XCircle } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    orders: 0,
    totalSpent: 0
  });

  const savedState = localStorage.getItem('user_location_state') || 'Lagos';
  const savedCity = localStorage.getItem('user_location_city') || 'Shomolu';

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Get current authenticated user
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        navigate('/login');
        return;
      }

      // Fetch user profile from profiles table (email lives on the auth
      // session, not a table column)
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // If user profile is missing or demo, fallback safely
      const finalUser = userData
        ? { ...userData, email: authUser?.email || userData.email }
        : {
        full_name: 'John Ogueh',
        email: authUser?.email || 'John.Ogueh@gmail.com',
        phone: '+234 803 123 4567',
        state: savedState,
        city: savedCity
      };
      
      setUser(finalUser);

      // Fetch user orders, with items (+ product & merchant names) and the
      // latest payment attempt on each
      const { data: ordersList, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items ( quantity, unit_price, inventory_id, products ( name ) ),
          payments ( status, created_at ),
          merchants ( business_name )
        `)
        .eq('buyer_id', authUser.id)
        .order('created_at', { ascending: false });

      if (!ordersError && ordersList) {
        const mapped = ordersList.map(o => {
          const firstItem = (o.order_items || [])[0];
          const latestPayment = (o.payments || []).slice().sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          )[0] || null;
          return {
            ...o,
            displayNumber: `ORD-${o.id.slice(0, 8).toUpperCase()}`,
            product_name: firstItem?.products?.name || '—',
            quantity: firstItem?.quantity || 0,
            inventory_id: firstItem?.inventory_id,
            merchant_name: o.merchants?.business_name || 'Unknown supplier',
            payment: latestPayment
          };
        });

        setOrders(mapped);
        const totalSpent = mapped
          .filter(o => o.status === 'confirmed' || o.payment?.status === 'verified')
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        
        setStats({
          orders: mapped.length,
          totalSpent
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user_location_state');
    localStorage.removeItem('user_location_city');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6]">
        <Loader className="w-8 h-8 animate-spin text-[#0B1F3A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#1E293B] pb-24 font-sans relative">
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0B1F3A]/5 rounded-full -mr-8 -mt-8" />
          
          <div className="w-16 h-16 rounded-full bg-[#0B1F3A] flex items-center justify-center text-white text-xl font-black font-display shadow mb-3">
            {user?.full_name?.slice(0, 2).toUpperCase() || 'JO'}
          </div>
          <h2 className="text-lg font-black font-display text-[#0B1F3A] uppercase tracking-tight">{user?.full_name}</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>

          <div className="flex gap-4 mt-5 pt-4 border-t border-slate-100 w-full text-center">
            <div className="flex-1">
              <span className="block text-[9px] font-mono text-slate-400 font-bold uppercase">Procurements</span>
              <span className="text-base font-black text-[#0B1F3A] font-mono mt-0.5">
                {stats.orders}
              </span>
            </div>
            <div className="w-px bg-slate-100" />
            <div className="flex-1">
              <span className="block text-[9px] font-mono text-slate-400 font-bold uppercase">Total Capital</span>
              <span className="text-base font-black text-emerald-600 font-mono mt-0.5">
                ₦{stats.totalSpent.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-black font-display text-[#0B1F3A] uppercase tracking-wider mb-1">Procurement Profile</h3>
          
          <div className="space-y-3 text-xs font-semibold text-[#1E293B]">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{user?.phone || '+234 803 123 4567'}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{user?.city || savedCity}, {user?.state || savedState}</span>
            </div>
          </div>
        </div>

        {/* Live Order Tracker Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-black font-display text-[#0B1F3A] uppercase tracking-wider">Active Procurement Status</h3>
          
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 text-center shadow-sm">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">No Active Transits</p>
                <p className="text-xs text-slate-400 mt-1">Initiate a ream order in the paper discovery catalog.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div 
                  key={order.id} 
                  onClick={() => navigate(`/checkout?product=${order.inventory_id}`)}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm hover:border-[#00C2FF] transition-all cursor-pointer flex justify-between items-center"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-xs text-slate-500 font-mono uppercase">{order.displayNumber}</p>
                    <h4 className="font-bold text-[#0B1F3A] text-sm">{order.product_name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">{order.quantity} Reams • {order.merchant_name}</p>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <p className="font-black text-[#0B1F3A] text-sm font-mono">₦{Number(order.total)?.toLocaleString()}</p>
                    <span className={`inline-flex items-center gap-1 mt-1.5 text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                      order.status === 'confirmed' || order.payment?.status === 'verified' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                      order.payment?.status === 'rejected' ? 'bg-red-50 text-red-800 border border-red-100' :
                      'bg-amber-50 text-amber-800 border border-amber-100'
                    }`}>
                      {order.status === 'confirmed' || order.payment?.status === 'verified' ? <CheckCircle2 className="w-2.5 h-2.5" /> :
                       order.payment?.status === 'rejected' ? <XCircle className="w-2.5 h-2.5" /> :
                       <Clock className="w-2.5 h-2.5" />}
                      {order.status === 'confirmed' || order.payment?.status === 'verified' ? 'confirmed' :
                       order.payment?.status === 'rejected' ? 'rejected' : 'pending'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4">
          <button 
            onClick={handleLogout}
            className="w-full py-3.5 border border-red-100 hover:border-red-200 bg-red-50 hover:bg-red-100/60 text-[#E53935] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out from Companion</span>
          </button>
        </div>

      </div>

      <BottomNav />
    </div>
  );
};

export default UserProfile;
