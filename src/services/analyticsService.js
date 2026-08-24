import { supabase } from '../supabaseClient';

/**
 * Track page view
 * @param {string} page - Page name
 * @param {string} userId - User ID (optional)
 */
export const trackPageView = async (page, userId = null) => {
  try {
    await supabase.from('analytics_events').insert({
      event_type: 'page_view',
      page: page,
      user_id: userId,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

/**
 * Track product view
 * @param {number} productId - Product ID
 * @param {string} userId - User ID (optional)
 */
export const trackProductView = async (productId, userId = null) => {
  try {
    await supabase.from('analytics_events').insert({
      event_type: 'product_view',
      product_id: productId,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error tracking product view:', error);
  }
};

/**
 * Track add to cart
 * @param {number} productId - Product ID
 * @param {number} quantity - Quantity added
 * @param {string} userId - User ID (optional)
 */
export const trackAddToCart = async (productId, quantity, userId = null) => {
  try {
    await supabase.from('analytics_events').insert({
      event_type: 'add_to_cart',
      product_id: productId,
      quantity: quantity,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error tracking add to cart:', error);
  }
};

/**
 * Track order completion
 * @param {Object} order - Order object
 * @param {string} userId - User ID
 */
export const trackOrderComplete = async (order, userId) => {
  try {
    await supabase.from('analytics_events').insert({
      event_type: 'order_complete',
      order_id: order.id,
      order_number: order.order_number,
      total_amount: order.total_amount,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error tracking order completion:', error);
  }
};

/**
 * Get merchant analytics
 * @param {string} merchantId - Merchant ID
 * @param {string} period - Time period (day, week, month, year)
 */
export const getMerchantAnalytics = async (merchantId, period = 'month') => {
  let interval;
  switch(period) {
    case 'day': interval = '1 day'; break;
    case 'week': interval = '7 days'; break;
    case 'month': interval = '30 days'; break;
    default: interval = '30 days';
  }
  
  try {
    // Get orders count by status
    const { data: ordersByStatus } = await supabase
      .from('orders')
      .select('order_status, count:order_status')
      .eq('merchant_id', merchantId)
      .gte('created_at', `now() - ${interval}::interval`)
      .group_by('order_status');
    
    // Get total revenue
    const { data: revenue } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('merchant_id', merchantId)
      .eq('order_status', 'confirmed')
      .gte('created_at', `now() - ${interval}::interval`);
    
    // Get top products
    const { data: topProducts } = await supabase
      .from('orders')
      .select('product_name, quantity')
      .eq('merchant_id', merchantId)
      .gte('created_at', `now() - ${interval}::interval`);
    
    const totalRevenue = revenue?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;
    
    // Aggregate top products
    const productSales = {};
    topProducts?.forEach(order => {
      productSales[order.product_name] = (productSales[order.product_name] || 0) + order.quantity;
    });
    
    const topProductsList = Object.entries(productSales)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    
    return {
      period,
      totalRevenue,
      ordersByStatus: ordersByStatus || [],
      topProducts: topProductsList,
      totalOrders: topProducts?.length || 0
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
};
