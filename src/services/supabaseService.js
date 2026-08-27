import { supabase } from '../supabaseClient';

// Stock Management
export const fetchStocks = async (merchantId) => {
  const { data, error } = await supabase
    .from('stocks')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const addStock = async (stockData) => {
  const { data, error } = await supabase
    .from('stocks')
    .insert([stockData])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updateStock = async (id, stockData) => {
  const { data, error } = await supabase
    .from('stocks')
    .update(stockData)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deleteStock = async (id) => {
  const { error } = await supabase
    .from('stocks')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

// Orders Management
export const fetchOrders = async (merchantId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const updateOrderStatus = async (orderId, status) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ order_status: status, updated_at: new Date() })
    .eq('id', orderId)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updatePaymentStatus = async (orderId, status) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ payment_status: status, updated_at: new Date() })
    .eq('id', orderId)
    .select();
  
  if (error) throw error;
  return data[0];
};

// Merchant Profile
export const fetchMerchantProfile = async (merchantId) => {
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('id', merchantId)
    .single();
  
  if (error) throw error;
  return data;
};

export const updateMerchantProfile = async (merchantId, profileData) => {
  const { data, error } = await supabase
    .from('merchants')
    .update(profileData)
    .eq('id', merchantId)
    .select();
  
  if (error) throw error;
  return data[0];
};
