import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  ArrowLeft, ShoppingBag, FileText, Upload, CheckCircle2, 
  Clock, XCircle, AlertCircle, Copy, Check, ShieldCheck 
} from 'lucide-react';
import BottomNav from '../components/BottomNav';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product');

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [deliveryFee, setDeliveryFee] = useState(2500);
  const [address, setAddress] = useState('Shomolu Printing Hub, Lagos');
  const [user, setUser] = useState(null);
  const [whatsappVerified, setWhatsappVerified] = useState(false);

  // Flow State
  // 'configure': Stage 1 order setup
  // 'settle': Stage 2 payment proof upload & active status tracking
  const [stage, setStage] = useState('configure'); 
  const [activeOrder, setActiveOrder] = useState(null);
  const [activePayment, setActivePayment] = useState(null);
  const [receiptSignedUrl, setReceiptSignedUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);

  useEffect(() => {
    fetchProduct();
    getCurrentUser();
  }, [productId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setUser(user);

    const { data: profile } = await supabase.from('profiles').select('whatsapp_verified').eq('id', user.id).single();
    setWhatsappVerified(Boolean(profile?.whatsapp_verified));
  };

  const fetchProduct = async () => {
    if (!productId) {
      navigate('/marketplace');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id, price, stock_quantity, minimum_order_quantity, delivery_available,
          products ( id, name, gsm, size ),
          merchants ( id, business_name )
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;

      const mapped = {
        id: data.id,
        product_id: data.products?.id,
        name: data.products?.name,
        gsm: data.products?.gsm,
        size: data.products?.size,
        price: Number(data.price),
        quantity: data.stock_quantity,
        minOrderQuantity: data.minimum_order_quantity || 1,
        delivery: data.delivery_available ? 'Yes' : 'No',
        merchant_id: data.merchants?.id,
        merchant_name: data.merchants?.business_name
      };

      setProduct(mapped);
      setQuantity(mapped.minOrderQuantity);
    } catch (err) {
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Place Order and generate transfer details
  const handleInitiateTransfer = async () => {
    if (!product || !user) return;

    if (!whatsappVerified) {
      alert('Please connect and verify your WhatsApp account before placing an order.');
      navigate('/verify-whatsapp');
      return;
    }

    const subtotal = quantity * product.price;
    const total = subtotal + deliveryFee;

    try {
      const { data: orderRows, error: orderError } = await supabase
        .from('orders')
        .insert([{
          buyer_id: user.id,
          merchant_id: product.merchant_id,
          subtotal,
          delivery_fee: deliveryFee,
          total,
          delivery_address: address
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const { error: itemError } = await supabase
        .from('order_items')
        .insert([{
          order_id: orderRows.id,
          inventory_id: product.id,
          product_id: product.product_id,
          quantity,
          unit_price: product.price,
          line_total: subtotal
        }]);

      if (itemError) throw itemError;

      setActiveOrder(orderRows);
      setActivePayment(null);
      setStage('settle');
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Failed to initiate order. Please try again.');
    }
  };

  // Step 2: Handle Receipt selection & simulated upload
  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setReceiptFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProof = async () => {
    if (!receiptFile || !activeOrder || !user) return;

    setUploading(true);
    try {
      const fileExt = receiptFile.name.split('.').pop();
      const filePath = `${user.id}/${activeOrder.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, receiptFile);

      if (uploadError) throw uploadError;

      const { data: paymentRow, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          order_id: activeOrder.id,
          buyer_id: user.id,
          merchant_id: activeOrder.merchant_id,
          method: 'bank_transfer',
          amount: activeOrder.total,
          receipt_path: filePath
        }])
        .select()
        .single();

      if (paymentError) throw paymentError;

      setActivePayment(paymentRow);
      alert('Receipt uploaded successfully! Awaiting merchant verification.');
    } catch (err) {
      console.error('Error uploading receipt proof:', err);
      alert('Receipt submission failed.');
    } finally {
      setUploading(false);
    }
  };

  const copyAccount = () => {
    navigator.clipboard.writeText('0123456789');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Refresh status from database to check if merchant verified it
  const handleRefreshStatus = async () => {
    if (!activeOrder) return;
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', activeOrder.id)
        .single();

      if (orderError) throw orderError;
      if (orderData) setActiveOrder(orderData);

      const { data: paymentRows, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', activeOrder.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (paymentError) throw paymentError;

      const latestPayment = paymentRows && paymentRows[0] ? paymentRows[0] : null;
      setActivePayment(latestPayment);

      if (latestPayment) {
        const { data: signed } = await supabase.storage
          .from('payment-receipts')
          .createSignedUrl(latestPayment.receipt_path, 3600);
        setReceiptSignedUrl(signed?.signedUrl || null);
      } else {
        setReceiptSignedUrl(null);
      }
    } catch (err) {
      console.error('Error refreshing order status:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6]">
        <div className="w-8 h-8 border-4 border-[#0B1F3A] border-t-[#00C2FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] p-4 text-center">
        <div>
          <p className="text-slate-500 font-bold">Paper product not found</p>
          <button onClick={() => navigate('/marketplace')} className="mt-4 px-4 py-2 bg-[#0B1F3A] text-white rounded-lg font-bold">
            Go to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const subtotal = quantity * product.price;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#1E293B] pb-24 font-sans relative">
      
      {/* Header bar */}
      <header className="bg-white border-b border-[#E2E8F0] py-4 px-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button 
            onClick={() => stage === 'settle' ? setStage('configure') : navigate(-1)}
            className="p-1 hover:bg-slate-100 rounded-lg text-[#0B1F3A]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-black font-display uppercase tracking-tight text-[#0B1F3A]">
            {stage === 'configure' ? 'Initiate Procurement' : 'Fintech Settlement'}
          </h1>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-4">

        {/* ================= STAGE 1: ORDER CONFIGURATION ================= */}
        {stage === 'configure' && (
          <div className="space-y-4 animate-fade-in">
            {/* Product Summary Card */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex gap-4">
              <div className="w-16 h-16 rounded-xl bg-[#0B1F3A] flex flex-col items-center justify-center text-white shrink-0 shadow-sm">
                <span className="text-2xl">📄</span>
                <span className="text-[8px] font-mono font-bold tracking-widest text-[#00C2FF]">{product.gsm}G</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-[#0B1F3A] truncate">{product.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{product.gsm}gsm • {product.size || '700×1000mm'}</p>
                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-tight flex items-center gap-1">
                  Supplier: <span className="text-[#00C2FF] font-display font-bold">{product.merchant_name}</span>
                </p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-[#0B1F3A] font-display">Procure Volume</span>
                <span className="text-xs font-mono text-slate-400 font-bold uppercase">per ream</span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5">
                <button
                  onClick={() => setQuantity(Math.max(product.minOrderQuantity || 1, quantity - 1))}
                  className="w-10 h-10 rounded-lg font-black text-[#0B1F3A] bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-lg active:scale-95 transition-all"
                >
                  -
                </button>
                <div className="text-center">
                  <span className="text-lg font-black text-[#0B1F3A] font-mono">{quantity}</span>
                  <span className="block text-[9px] font-bold text-slate-400 font-mono uppercase">Ream{quantity > 1 ? 's' : ''}</span>
                </div>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg font-black text-[#0B1F3A] bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-lg active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm space-y-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Delivery Logistics</span>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase font-mono">Procurement Delivery Destination</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street Address, City, State"
                  className="w-full p-3 bg-slate-50 border border-[#E2E8F0] text-sm rounded-xl focus:border-[#00C2FF] outline-none text-[#1E293B] font-semibold"
                />
              </div>
            </div>

            {/* Price Summary Card */}
            <div className="bg-[#0B1F3A] text-white rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Material Cost ({quantity} Reams)</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Regional Transit Fee</span>
                <span>₦{deliveryFee.toLocaleString()}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between items-end">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono">Total Procurement Capital</span>
                  <span className="text-xl font-black text-[#00C2FF] font-mono">₦{total.toLocaleString()}</span>
                </div>
                <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded font-bold uppercase text-white">GTBank Invoice</span>
              </div>
            </div>

            {/* Proceed CTA */}
            <button
              onClick={handleInitiateTransfer}
              className="w-full py-4 bg-[#0B1F3A] hover:bg-[#16365C] text-white font-bold font-display rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Place Order & Transfer</span>
              <ArrowLeft className="w-4 h-4 text-[#00C2FF] rotate-180" />
            </button>
          </div>
        )}


        {/* ================= STAGE 2: SETTLEMENT & PAYMENT PROOF UPLOAD ================= */}
        {stage === 'settle' && activeOrder && (
          <div className="space-y-4 animate-fade-in">
            {/* INVOICE CARD */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <div className="flex justify-between items-start border-b border-[#E2E8F0] pb-4 mb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#E53935] bg-red-50 border border-red-100 px-2.5 py-0.5 rounded">
                    Invoice Drafted
                  </span>
                  <h3 className="font-bold text-lg text-[#0B1F3A] mt-2 font-mono uppercase">ORD-{activeOrder.id.slice(0, 8)}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Date: {new Date(activeOrder.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-mono">Invoice Total</span>
                  <p className="text-lg font-black text-[#0B1F3A] font-mono">₦{activeOrder.total?.toLocaleString()}</p>
                </div>
              </div>

              {/* Bank accounts to transfer to */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#0B1F3A] uppercase font-mono">Payment Destination</span>
                  <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">GTBank Instant</span>
                </div>
                
                <div className="space-y-1.5 text-xs text-[#1E293B]">
                  <p className="font-bold text-slate-500 flex justify-between">Bank Name: <span className="text-[#0B1F3A]">Guaranty Trust Bank (GTBank)</span></p>
                  <p className="font-bold text-slate-500 flex justify-between">Account Name: <span className="text-[#0B1F3A]">Printers Companion (PC)</span></p>
                  
                  <div className="font-bold text-slate-500 flex justify-between items-center pt-1">
                    <span>Account Number:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#0B1F3A] font-mono text-sm font-black bg-white px-2 py-0.5 border rounded">0123456789</span>
                      <button 
                        onClick={copyAccount}
                        className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-[#0B1F3A] transition-colors"
                        title="Copy Account Number"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= RECIPIENT STATUS TIMELINE ================= */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-[#0B1F3A] font-mono tracking-wider">Settlement Verification</span>
                <button 
                  onClick={handleRefreshStatus}
                  className="text-[10px] font-mono font-bold uppercase text-[#00C2FF] flex items-center gap-1 hover:underline"
                >
                  <Clock className="w-3 h-3 animate-spin" /> Sync Ledger
                </button>
              </div>

              {/* Status indicator timeline: Pending, Verified, Rejected */}
              <div className="grid grid-cols-3 gap-2 relative">
                {/* Pending step */}
                <div className={`p-3 rounded-xl border text-center transition-all ${
                  activeOrder.status === 'pending_payment' && (!activePayment || activePayment.status === 'pending')
                    ? 'border-amber-400 bg-amber-50 text-amber-800'
                    : 'border-slate-100 bg-slate-50 text-slate-400'
                }`}>
                  <Clock className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider font-mono">Pending</span>
                </div>

                {/* Verified step */}
                <div className={`p-3 rounded-xl border text-center transition-all ${
                  activeOrder.status === 'confirmed' || activePayment?.status === 'verified'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                    : 'border-slate-100 bg-slate-50 text-slate-400'
                }`}>
                  <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider font-mono">Verified</span>
                </div>

                {/* Rejected step */}
                <div className={`p-3 rounded-xl border text-center transition-all ${
                  activePayment?.status === 'rejected'
                    ? 'border-red-400 bg-red-50 text-red-800'
                    : 'border-slate-100 bg-slate-50 text-slate-400'
                }`}>
                  <XCircle className="w-4 h-4 mx-auto mb-1 text-red-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider font-mono">Rejected</span>
                </div>
              </div>

              {/* Active help prompt */}
              <div className="bg-[#F8F8F6] p-3.5 rounded-xl border border-slate-100 text-xs text-slate-500 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0 mt-0.5" />
                <div>
                  {activeOrder.status === 'pending_payment' && !activePayment && (
                    <p>Please run the transfer from your banking application to the account details above, and upload your transfer receipt below.</p>
                  )}
                  {activeOrder.status === 'pending_payment' && activePayment?.status === 'pending' && (
                    <p>Your payment proof is successfully submitted. The paper merchant is validating the deposit in their GTBank ledger.</p>
                  )}
                  {(activeOrder.status === 'confirmed' || activePayment?.status === 'verified') && (
                    <p className="text-emerald-700 font-bold">Awesome! The merchant verified your payment. Your shipment is being packaged for dispatch!</p>
                  )}
                  {activePayment?.status === 'rejected' && (
                    <p className="text-red-700 font-bold">Deposit verification failed{activePayment.rejection_reason ? `: ${activePayment.rejection_reason}` : ''}. Please re-upload a valid transfer receipt.</p>
                  )}
                </div>
              </div>
            </div>

            {/* ================= UPLOAD PAYMENT PROOF CONTAINER ================= */}
            {activeOrder.status !== 'confirmed' && activePayment?.status !== 'verified' && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
                <span className="block text-xs font-black uppercase text-[#0B1F3A] font-mono tracking-wider">Upload Transfer Receipt</span>

                {/* Drag / Select container */}
                <div 
                  onClick={() => document.getElementById('receipt-uploader').click()}
                  className="border-2 border-dashed border-[#E2E8F0] hover:border-[#00C2FF] rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50/50 transition-all"
                >
                  {receiptPreview ? (
                    <div className="relative inline-block">
                      <img src={receiptPreview} alt="Transfer Receipt Preview" className="h-40 rounded-lg border object-cover shadow-sm" />
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setReceiptPreview(null); 
                          setReceiptFile(null); 
                        }}
                        className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : activePayment?.receipt_path ? (
                    <div className="space-y-2">
                      {receiptSignedUrl && (
                        <img src={receiptSignedUrl} alt="Receipt proof" className="h-28 mx-auto rounded-lg border object-cover" />
                      )}
                      <p className="text-xs font-mono font-bold text-[#0B1F3A]">Receipt Proof Uploaded</p>
                      <span className="inline-block text-[9px] font-bold text-slate-400">Click to replace receipt proof</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-[#0B1F3A]">Click to select bank transfer receipt</p>
                      <span className="block text-[10px] text-slate-400 font-mono">Accepts JPG, PNG, PDF (max 2MB)</span>
                    </div>
                  )}
                  <input
                    id="receipt-uploader"
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptChange}
                    className="hidden"
                  />
                </div>

                {/* Submit button for proof */}
                {receiptPreview && (
                  <button
                    onClick={handleUploadProof}
                    disabled={uploading}
                    className="w-full py-3 bg-[#0B1F3A] text-white hover:bg-[#16365C] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#00C2FF]" />
                    )}
                    <span>Submit Transfer Receipt</span>
                  </button>
                )}
              </div>
            )}

            {/* Back to Discovery */}
            <button
              onClick={() => navigate('/marketplace')}
              className="w-full py-3.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 rounded-xl text-xs font-bold text-[#0B1F3A] transition-all font-display"
            >
              Back to Marketplace
            </button>
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  );
};

export default Checkout;
