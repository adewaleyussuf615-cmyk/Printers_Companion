import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export const useRealtimeOrders = (merchantId) => {
  const [orders, setOrders] = useState([]);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!merchantId) return;

    // Initial fetch
    fetchOrders();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('orders-channel')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders',
          filter: `merchant_id=eq.${merchantId}`
        }, 
        (payload) => {
          console.log('New order received:', payload);
          setNewOrderCount(prev => prev + 1);
          // Play notification sound
          playNotificationSound();
          // Show browser notification
          showNotification(payload.new);
          fetchOrders();
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `merchant_id=eq.${merchantId}`
        },
        (payload) => {
          console.log('Order updated:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [merchantId]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });
    
    if (data) {
      setOrders(data);
      setLastUpdate(new Date());
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  const showNotification = (order) => {
    if (Notification.permission === 'granted') {
      new Notification('New Order Received!', {
        body: `Order #${order.order_number} for ${order.product_name}`,
        icon: '/logo.png'
      });
    }
  };

  const clearNewOrderCount = () => setNewOrderCount(0);

  return { 
    orders, 
    newOrderCount, 
    lastUpdate, 
    clearNewOrderCount,
    refreshOrders: fetchOrders 
  };
};
