import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import { ProtectedRoute } from './ProtectedRoute'
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
import Orders from './pages/Orders'
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
  const [merchantId, setMerchantId] = useState<string | null>(null)
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

    const browserWindow = window as Window & { __pcDeferredInstallPrompt?: any }
    const handleInstallAvailable = (event: Event) => {
      event.preventDefault()
      browserWindow.__pcDeferredInstallPrompt = event
    }
    window.addEventListener('beforeinstallprompt', handleInstallAvailable)
    
    // Get initial session
    supabase.auth.getSession().then((res: any) => {
      const session = res.data?.session || null;
      console.log('Initial session:', session);
      setSession(session)
      if (session) {
        fetchMerchantId(session.user.id)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      console.log('Auth state changed:', _event, session);
      setSession(session)
      if (session?.user) {
        fetchMerchantId(session.user.id)
      } else {
        setMerchantId(null)
      }
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallAvailable)
      subscription.unsubscribe()
    }
  }, [])

  async function fetchMerchantId(userId: string) {
    console.log('Fetching merchant ID for user:', userId);
    const { data: { user } } = await supabase.auth.getUser()
    const metadataRole = user?.user_metadata?.role || user?.app_metadata?.role
    // First check if user is a merchant
    let isMerchant = metadataRole === 'merchant'
    if (!isMerchant) {
      const { data: userData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
      isMerchant = userData?.role === 'merchant'
    }
    
    if (isMerchant) {
      // Get merchant ID from merchants table
      const { data: merchantData, error } = await supabase
        .from('merchants')
        .select('id')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      
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
          <Route path="/verify-whatsapp" element={<ConnectWhatsApp />} />
          <Route path="/connect-whatsapp" element={<Navigate to="/verify-whatsapp" replace />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/merchant/login" element={<MerchantLogin />} />
          <Route path="/merchant/signup" element={<MerchantSignup />} />

          {/* Every buyer route is protected by the profile verification gate. */}
          <Route element={<ProtectedRoute allowedRoles={['buyer']} />}>
            <Route path="/marketplace" element={<BuyerMarketplace />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/buyer" element={<BuyerSearch />} />
            <Route path="/place-order" element={<PlaceOrder />} />
          </Route>

          {/* Every merchant route is role-checked after the verification gate. */}
          <Route element={<ProtectedRoute allowedRoles={['merchant']} />}>
            <Route path="/merchant/dashboard" element={<MerchantDashboard merchantId={merchantId || undefined} />} />
            <Route path="/merchant/stocks" element={<MerchantDashboard merchantId={merchantId || undefined} />} />
            <Route path="/merchant/orders" element={<MerchantOrders merchantId={merchantId || undefined} />} />
            <Route path="/merchant/settings" element={<MerchantSettings merchantId={merchantId || undefined} />} />
            <Route path="/merchant/*" element={<MerchantDashboard merchantId={merchantId || undefined} />} />
          </Route>

          {/* Administrative verification actions also require a verified account. */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'merchant']} />}>
            <Route path="/admin/whatsapp" element={<AdminWhatsAppVerifications />} />
          </Route>
          
          {/* Catch-all - Redirect to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
