import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, CheckCircle, Loader2, RefreshCw, Clock } from 'lucide-react';
import { supabase } from '../supabaseClient';
import BrandLogo from '../components/BrandLogo';

// Your business WhatsApp number in international format, digits only (no +, spaces, or dashes).
// e.g. 2348012345678 for a Nigerian +234 801 234 5678 number.
const BUSINESS_WHATSAPP_NUMBER = import.meta.env.VITE_BUSINESS_WHATSAPP_NUMBER || '';

const ConnectWhatsApp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState(null); // pending row
  const [accountRole, setAccountRole] = useState('buyer');
  const [status, setStatus] = useState('loading'); // loading | pending | verified | expired | error
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    init();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const init = async () => {
    setLoading(true);
    setError('');

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      navigate('/login');
      return;
    }
    setAccountRole(user.user_metadata?.role || 'buyer');

    if (!user.email_confirmed_at) {
      navigate('/verify-email');
      return;
    }

    // Already verified? Skip straight through.
    const { data: profile } = await supabase
      .from('profiles')
      .select('whatsapp_verified, whatsapp_number')
      .eq('id', user.id)
      .single();

    if (profile?.whatsapp_verified) {
      setStatus('verified');
      setLoading(false);
      return;
    }

    // Reuse an existing pending, unexpired request if there is one; otherwise create one.
    const { data: existing } = await supabase
      .from('whatsapp_verifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let row = existing;

    if (!row) {
      const { data: inserted, error: insertError } = await supabase
        .rpc('create_whatsapp_verification')
        .single();

      if (insertError) {
        setError(insertError.message || 'Could not start WhatsApp verification.');
        setLoading(false);
        return;
      }
      row = inserted;
    }

    setVerification(row);
    setStatus('pending');
    setLoading(false);
    startPolling(row.id);
  };

  const startPolling = (verificationId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('whatsapp_verifications')
        .select('*')
        .eq('id', verificationId)
        .single();

      if (!data) return;

      if (data.status === 'verified') {
        setStatus('verified');
        clearInterval(pollRef.current);
      } else if (data.status === 'rejected') {
        setStatus('error');
        setError('Your WhatsApp verification code did not match. Please try again.');
        clearInterval(pollRef.current);
      } else if (new Date(data.expires_at) < new Date()) {
        setStatus('expired');
        clearInterval(pollRef.current);
      }
    }, 4000);
  };

  const waLink = verification
    ? `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${encodeURIComponent(
        `Hello. Connect my WhatsApp account.\nVerification Code: ${verification.token}`
      )}`
    : '#';

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#1E293B] flex flex-col">
      <header className="bg-white border-b border-[#E2E8F0] py-4 px-6 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <BrandLogo size="md" />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 border border-[#E2E8F0] text-center">
          {loading ? (
            <div className="py-10">
              <Loader2 className="w-8 h-8 text-[#0B1F3A] animate-spin mx-auto" />
            </div>
          ) : status === 'verified' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold font-display text-[#0B1F3A] mb-2">WhatsApp connected</h2>
              <p className="text-slate-500 text-sm mb-6">
                Your account is fully verified. You're all set to start ordering.
              </p>
              <button
                onClick={() => navigate(accountRole === 'merchant' ? '/merchant/dashboard' : '/marketplace')}
                className="w-full py-3 bg-[#0B1F3A] hover:bg-[#16365C] text-white font-bold rounded-xl transition-all font-display"
              >
                Continue to Marketplace
              </button>
            </>
          ) : status === 'expired' ? (
            <>
              <Clock className="w-10 h-10 text-[#E53935] mx-auto mb-3" />
              <h2 className="text-lg font-bold font-display text-[#0B1F3A] mb-2">Code expired</h2>
              <p className="text-slate-500 text-sm mb-6">That verification code has expired. Generate a new one to continue.</p>
              <button
                onClick={init}
                className="w-full py-3 bg-[#0B1F3A] hover:bg-[#16365C] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 font-display"
              >
                <RefreshCw className="w-4 h-4" /> Get a new code
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold font-display text-[#0B1F3A] mb-2">Connect your WhatsApp</h2>
              <p className="text-slate-500 text-sm mb-6">
                Your email is verified. One last step — tap below to send us a quick WhatsApp message.
                The WhatsApp account that sends the code becomes your verified number.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-100 text-[#E53935] text-xs font-semibold rounded-xl p-3 mb-4">
                  {error}
                </div>
              )}

              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 font-display tracking-wide"
              >
                <MessageCircle className="w-5 h-5" />
                Connect on WhatsApp
              </a>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Waiting for confirmation — this updates automatically
              </div>

              {verification && (
                <p className="text-[11px] text-slate-400 mt-4">
                  Code: <span className="font-mono font-semibold text-slate-500">{verification.token}</span> · expires in 30 minutes
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 pb-6">
        Having trouble? <Link to={accountRole === 'merchant' ? '/merchant/dashboard' : '/marketplace'} className="underline">Skip for now</Link>
      </p>
    </div>
  );
};

export default ConnectWhatsApp;
