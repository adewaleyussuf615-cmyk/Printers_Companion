import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, CheckCircle, XCircle, Loader2, ShieldAlert, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AdminWhatsAppVerifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [rows, setRows] = useState([]);
  const [numberInputs, setNumberInputs] = useState({}); // verificationId -> typed number
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setAuthorized(true);

    const { data, error } = await supabase
      .from('whatsapp_verifications')
      .select('id, token, status, expires_at, created_at, whatsapp_number, profiles(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (!error) setRows(data || []);
    setLoading(false);
  };

  const approve = async (id) => {
    const number = (numberInputs[id] || '').trim();
    if (!number) {
      setToast('Enter the WhatsApp number that sent the message first.');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    setBusyId(id);
    const { error } = await supabase.rpc('approve_whatsapp_verification', {
      p_verification_id: id,
      p_whatsapp_number: number
    });
    setBusyId(null);
    if (error) {
      setToast(error.message || 'Failed to approve.');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const reject = async (id) => {
    setBusyId(id);
    const { error } = await supabase.rpc('reject_whatsapp_verification', { p_verification_id: id });
    setBusyId(null);
    if (error) {
      setToast(error.message || 'Failed to reject.');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0B1F3A] animate-spin" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#F8F8F6] flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-md p-8 border border-[#E2E8F0] text-center">
          <ShieldAlert className="w-10 h-10 text-[#E53935] mx-auto mb-3" />
          <h2 className="text-lg font-bold font-display text-[#0B1F3A] mb-2">Admins only</h2>
          <p className="text-slate-500 text-sm">You don't have access to this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display text-[#0B1F3A]">WhatsApp Verifications</h1>
            <p className="text-slate-500 text-sm mt-1">
              Match the code from an incoming WhatsApp message to the sender's number below.
            </p>
          </div>
          <button
            onClick={load}
            className="p-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#0B1F3A] transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {toast && (
          <div className="bg-red-50 border border-red-100 text-[#E53935] text-sm font-semibold rounded-xl p-3 mb-4">
            {toast}
          </div>
        )}

        {rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center text-slate-400 text-sm">
            No pending WhatsApp verifications right now.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(row => (
              <div key={row.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-[#0B1F3A]">{row.profiles?.full_name || 'Unknown user'}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Requested {new Date(row.created_at).toLocaleString()} · expires {new Date(row.expires_at).toLocaleTimeString()}
                    </p>
                    <p className="mt-2 font-mono text-sm font-bold text-[#0B1F3A] bg-slate-50 inline-block px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
                      {row.token}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      placeholder="WhatsApp number received"
                      value={numberInputs[row.id] || ''}
                      onChange={(e) => setNumberInputs(prev => ({ ...prev, [row.id]: e.target.value }))}
                      className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/10 w-48"
                    />
                    <button
                      disabled={busyId === row.id}
                      onClick={() => approve(row.id)}
                      className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
                      title="Approve"
                    >
                      {busyId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                    <button
                      disabled={busyId === row.id}
                      onClick={() => reject(row.id)}
                      className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#E53935] disabled:opacity-60"
                      title="Reject"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWhatsAppVerifications;
