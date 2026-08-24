import { supabase } from '../supabaseClient';

/**
 * Send order confirmation email
 * @param {Object} order - Order object
 * @param {string} userEmail - User's email address
 * @param {string} userName - User's name
 */
export const sendOrderConfirmation = async (order, userEmail, userName) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { order, userEmail, userName, orderType: 'order_confirmation' }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

/**
 * Send payment verification email
 */
export const sendPaymentVerified = async (order, userEmail, userName) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { order, userEmail, userName, orderType: 'payment_verified' }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

/**
 * Send shipping confirmation email
 */
export const sendOrderShipped = async (order, userEmail, userName) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { order, userEmail, userName, orderType: 'order_shipped' }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
