import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { isSupabaseConfigured, supabase } from '../supabaseClient';

export default function VerifyEmail(){
 const navigate = useNavigate();
 const [checking, setChecking] = useState(true);

 useEffect(() => {
  let active = true;

  const routeConfirmedUser = async (session) => {
   if (!session?.user?.email_confirmed_at || !active) return;
   navigate('/connect-whatsapp', { replace: true });
  };

  supabase.auth.getSession().then(({ data }) => {
   routeConfirmedUser(data.session).finally(() => {
    if (active) setChecking(false);
   });
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
   routeConfirmedUser(session);
  });

  return () => {
   active = false;
   subscription.unsubscribe();
  };
 }, [navigate]);

 return <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] px-4">
  <div className="max-w-md bg-white rounded-2xl p-8 shadow text-center">
   <div className="flex justify-center mb-6"><BrandLogo size="sm" /></div>
   <h1 className="text-2xl font-bold text-[#0B1F3A]">{checking ? 'Checking your email status' : 'Check your email'}</h1>
    <p className="text-slate-600 mt-3">{checking ? 'Please wait while we confirm your account.' : isSupabaseConfigured ? 'We sent a verification link to your email. After you confirm it, you will continue directly to WhatsApp verification.' : 'Demo mode is active because Supabase is not configured. No email can be sent locally.'}</p>
   {!checking && <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
    <Link className="bg-[#0B1F3A] text-white px-6 py-3 rounded-xl" to="/login">Buyer Login</Link>
    <Link className="border border-[#0B1F3A] text-[#0B1F3A] px-6 py-3 rounded-xl" to="/merchant/login">Merchant Login</Link>
   </div>}
  </div>
 </div>
}
