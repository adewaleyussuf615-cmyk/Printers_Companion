import { supabase } from '../supabaseClient';
import { Resend } from 'resend';

const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Send a test email using the Resend API.
 * Replace re_xxxxxxxxx in your .env file with your real API key.
 */
export const sendResendTestEmail = async () => {
  if (!resend) {
    console.warn('Missing VITE_RESEND_API_KEY. Replace re_xxxxxxxxx with your real Resend API key in your .env file.');
    return null;
  }

  try {
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'adewaleyussuf615@gmail.com',
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
    });

    return response;
  } catch (error) {
    console.error('Error sending email with Resend:', error);
    throw error;
  }
};

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
