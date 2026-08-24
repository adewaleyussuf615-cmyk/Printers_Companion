import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import WelcomeScreen from './components/WelcomeScreen'
import Auth from './components/Auth'
import BuyerSearch from './components/BuyerSearch'
import MerchantDashboard from "./pages/merchant/MerchantDashboard";
import PlaceOrder from './components/PlaceOrder'
import TestAuth from './components/TestAuth'

// @ts-ignore
import SignUp from './pages/SignUp'
// @ts-ignore
import Login from './pages/Login'
// @ts-ignore
import LandingPage from './pages/LandingPage'
// @ts-ignore
import BuyerMarketplace from './pages/BuyerMarketplace'
// @ts-ignore
import Checkout from './pages/Checkout'
// @ts-ignore
import OrderConfirmation from './pages/OrderConfirmation'
// @ts-ignore
import UserProfile from './pages/UserProfile'
// @ts-ignore
import ConnectWhatsApp from './pages/ConnectWhatsApp'
// @ts-ignore
import AdminWhatsAppVerifications from './pages/AdminWhatsAppVerifications'
// @ts-ignore
import VerifyEmail from './pages/VerifyEmail'

// Merchant Pages
// @ts-ignore
import MerchantLogin from './pages/merchant/MerchantLogin'
// @ts-ignore
import MerchantSignup from './pages/merchant/MerchantSignup'
// @ts-ignore
// @ts-ignore
import MerchantOrders from './pages/merchant/MerchantOrders'
// @ts-ignore
import MerchantSettings from './pages/merchant/MerchantSettings'

// Debug function to check environment variables
const debugEnv = () => {
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  console.log('All env vars:', import.meta.env);
}

function App() {
  console.log('App starting...');
  debugEnv();
  
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [merchantId, setMerchantId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem('pc_splash_shown')
    } catch {
      return true
    }
  })

  const dismissSplash = () => {
    try {
      sessionStorage.setItem('pc_splash_shown', '1')
    } catch {}
    setShowSplash(false)
  }

  useEffect(() => {
    console.log('useEffect running...');
    
    // Get initial session
    supabase.auth.getSession().then((res: any) => {
      const session = res.data?.session || null;
      console.log('Initial session:', session);
      setSession(session)
      if (session) {
        Promise.all([
          fetchUserRole(session.user.id),
          fetchMerchantId(session.user.id)
        ]).finally(() => setAuthLoading(false))
      } else {
        setAuthLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      console.log('Auth state changed:', _event, session);
      setSession(session)
      if (session?.user) {
        setAuthLoading(true)
        Promise.all([
          fetchUserRole(session.user.id),
          fetchMerchantId(session.user.id)
        ]).finally(() => setAuthLoading(false))
      } else {
        setUserRole(null)
        setMerchantId(null)
        setAuthLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchUserRole(userId: string) {
    console.log('Fetching user role for:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    if (!error && data) {
      console.log('User role:', data.role);
      setUserRole(data.role)
    } else if (error) {
      console.error('Error fetching user role:', error);
      const { data: { user } } = await supabase.auth.getUser()
      setUserRole(user?.user_metadata?.role || null)
    }
  }

  async function fetchMerchantId(userId: string) {
    console.log('Fetching merchant ID for user:', userId);
    // First check if user is a merchant
    const { data: userData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (userData?.role === 'merchant') {
      // Get merchant ID from merchants table
      const { data: merchantData, error } = await supabase
        .from('merchants')
        .select('id')
        .eq('owner_id', userId)
        .single()
      
      if (!error && merchantData) {
        console.log('Merchant ID:', merchantData.id);
        setMerchantId(merchantData.id)
      } else {
        // If no merchant record exists, use the user ID as merchant ID
        console.log('Using user ID as merchant ID:', userId);
        setMerchantId(userId)
      }
    }
  }

  return (
    <BrowserRouter>
      {showSplash && <WelcomeScreen onFinish={dismissSplash} />}
      <div className="app">
        <Routes>
          {/* Test Routes */}
          <Route path="/test" element={<TestAuth />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Public Routes - Landing, Sign Up & Login */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          
          {/* Buyer Routes */}
          <Route path="/buyer/login" element={<Login />} />
          <Route path="/buyer/signup" element={<SignUp />} />
          <Route path="/connect-whatsapp" element={<ConnectWhatsApp />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/admin/whatsapp" element={<AdminWhatsAppVerifications />} />
          <Route path="/marketplace" element={<BuyerMarketplace />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/orders" element={<OrderConfirmation />} />
          
          {/* Merchant Routes - Pass merchantId to components */}
          <Route path="/merchant/login" element={<MerchantLogin />} />
          <Route path="/merchant/signup" element={<MerchantSignup />} />
          <Route
            path="/merchant/dashboard"
            element={
              authLoading ? (
                <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading merchant dashboard...</div>
              ) : session && userRole === 'merchant' ? (
                <MerchantDashboard merchantId={merchantId || undefined} />
              ) : (
                <Navigate to="/merchant/login" />
              )
            }
          />
          <Route
            path="/merchant/stocks"
            element={
              authLoading ? (
                <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading merchant dashboard...</div>
              ) : session && userRole === 'merchant' ? (
                <MerchantDashboard merchantId={merchantId || undefined} />
              ) : (
                <Navigate to="/merchant/login" />
              )
            }
          />
          <Route
            path="/merchant/orders"
            element={
              session && userRole === 'merchant' ? (
                <MerchantOrders merchantId={merchantId || undefined} />
              ) : (
                <Navigate to="/merchant/login" />
              )
            }
          />
          <Route
            path="/merchant/settings"
            element={
              session && userRole === 'merchant' ? (
                <MerchantSettings merchantId={merchantId || undefined} />
              ) : (
                <Navigate to="/merchant/login" />
              )
            }
          />
          
          {/* Legacy Buyer Routes (for backward compatibility) */}
          <Route
            path="/buyer"
            element={
              session && userRole === 'buyer' ? (
                <BuyerSearch />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/place-order"
            element={
              session && userRole === 'buyer' ? (
                <PlaceOrder />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          
          {/* Legacy Merchant Route */}
          <Route
            path="/merchant/*"
            element={
              session && userRole === 'merchant' ? (
                <MerchantDashboard merchantId={merchantId || undefined} />
              ) : (
                <Navigate to="/merchant/login" />
              )
            }
          />
          
          {/* Catch-all - Redirect to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
