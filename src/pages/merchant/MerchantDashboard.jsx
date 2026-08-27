import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import logoMark from '../../assets/logo-mark.png';
import { 
  TrendingUp, DollarSign, Package, ShoppingBag, Loader, 
  Bell, Sparkles, CheckCircle2, Plus, Edit2, Trash2, 
  Truck, AlertTriangle, Eye, RefreshCw, XCircle, Ban, ArrowRight, Star 
} from 'lucide-react';
import {
  PAPER_FAMILIES,
  FINISHES,
  PAPER_SIZES,
  PRINT_USE_CASES,
  PRODUCT_CATEGORIES,
  PRINTING_TYPES,
  COLOR_OPTIONS,
  PRICE_UNITS,
  CURRENCIES
} from '../../constants/marketplaceAttributes';
import { uploadProductImage, compressImage } from '../../services/uploadService';

const MerchantDashboard = ({ merchantId }) => {
  const [loading, setLoading] = useState(true);
  const [merchantSetup, setMerchantSetup] = useState({ status: 'checking', id: null, error: '' });
  const [businessName, setBusinessName] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'inventory', 'orders'

  // Dashboard stats state
  const [stats, setStats] = useState({
    products: 0,
    pendingOrders: 0,
    earnings: 0
  });

  // Database lists
  const [stocks, setStocks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]); // full products catalog (id, name, gsm, size)
  const [paperTypes, setPaperTypes] = useState(PAPER_FAMILIES);

  // Form states for Add/Edit Stock
  const [isEditingStock, setIsEditingStock] = useState(false);
  const [editingStockId, setEditingStockId] = useState(null);
  const [stockForm, setStockForm] = useState({
    productId: '',
    productMode: 'existing',
    name: '',
    description: '',
    category: '',
    paperFamily: '',
    paperSubType: '',
    paperWeightGsm: '',
    finish: '',
    paperSize: '',
    printUseCase: '',
    printingType: 'Single Side',
    colorOption: 'Full Color',
    minimumQuantity: 100,
    productionTime: '2-3 Days',
    price: 18500,
    currency: 'NGN',
    priceUnit: 'Per Piece',
    quantity: 150,
    delivery: 'Yes'
  });

  // Modal / Verification states
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState(null);
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedGsm, setSelectedGsm] = useState([]);
  const [gsmPrices, setGsmPrices] = useState({});
  const [existingProductSearch, setExistingProductSearch] = useState('');

  useEffect(() => {
    if (!viewingReceiptOrder?.payment?.receipt_path) {
      setViewingReceiptUrl(null);
      return;
    }
    supabase.storage
      .from('payment-receipts')
      .createSignedUrl(viewingReceiptOrder.payment.receipt_path, 3600)
      .then(({ data }) => setViewingReceiptUrl(data?.signedUrl || null));
  }, [viewingReceiptOrder]);

  const activeMerchantId = merchantSetup.id || (merchantId && merchantId !== 'merchant-demo' ? merchantId : null);

  useEffect(() => {
    let cancelled = false;
    const setupMerchant = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user?.id) throw new Error('Your merchant session has expired. Please sign in again.');

        const cachedMerchantId = sessionStorage.getItem(`merchant_profile_id:${user.id}`);
        if (cachedMerchantId) {
          if (!cancelled) setMerchantSetup({ status: 'ready', id: cachedMerchantId, error: '' });
          return;
        }

        const { data: existingMerchantId, error: setupError } = await supabase.rpc(
          'ensure_merchant_profile',
          { business_name: null }
        );
        if (setupError) throw setupError;

        if (!cancelled) {
          setMerchantSetup(existingMerchantId
            ? { status: 'ready', id: existingMerchantId, error: '' }
            : { status: 'needs_setup', id: null, error: '' });
          if (existingMerchantId) {
            sessionStorage.setItem(`merchant_profile_id:${user.id}`, existingMerchantId);
          }
        }
      } catch (error) {
        if (!cancelled) setMerchantSetup({ status: 'error', id: null, error: error.message || 'Unable to set up your merchant profile.' });
      }
    };
    setupMerchant();
    return () => { cancelled = true; };
  }, [merchantId]);

  useEffect(() => {
    if (merchantSetup.status !== 'ready' || !activeMerchantId) return;
    fetchDashboardData();
    fetchPaperTypes();
  }, [merchantSetup.status, activeMerchantId]);

  const fetchPaperTypes = async () => {
    const { data, error } = await supabase
      .from('paper_types')
      .select('paper_family, sub_types, weight_options, finish_options, size_options, print_use_cases')
      .order('paper_family');
    if (!error && data?.length) {
      setPaperTypes(data.map(row => ({
        family: row.paper_family,
        subTypes: row.sub_types || [],
        weights: row.weight_options || [],
        finishes: row.finish_options || FINISHES,
        sizes: row.size_options || PAPER_SIZES,
        printUseCases: row.print_use_cases || PRINT_USE_CASES
      })));
    }
  };

  const fetchCatalog = async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select('product_id, products ( id, name, description, gsm, size, paper_family, paper_sub_type, paper_weight_gsm, finish, paper_size, print_use_case, printing_type, color_option, minimum_quantity, production_time, price, currency, price_unit )')
      .eq('merchant_id', activeMerchantId);
    if (!error && data) {
      const products = data.map(row => row.products).filter(Boolean);
      setCatalog(products.sort((a, b) => a.name.localeCompare(b.name) || Number(a.paper_weight_gsm || a.gsm) - Number(b.paper_weight_gsm || b.gsm)));
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch this merchant's inventory (joined with the product catalog)
      const { data: stockData, error: stockErr } = await supabase
        .from('inventory')
        .select(`
          id, price, stock_quantity, minimum_order_quantity, delivery_available, is_active,
          products ( id, name, gsm, size, paper_family, paper_sub_type, paper_weight_gsm, finish, paper_size )
        `)
        .eq('merchant_id', activeMerchantId);

      let merchantStocks = [];
      if (!stockErr && stockData) {
        merchantStocks = stockData.map(row => ({
          id: row.id,
          product_id: row.products?.id,
          name: row.products?.name,
          gsm: row.products?.gsm,
          paperFamily: row.products?.paper_family,
          paperSubType: row.products?.paper_sub_type,
          paperWeightGsm: row.products?.paper_weight_gsm,
          finish: row.products?.finish,
          paperSize: row.products?.paper_size,
          minimum_order_quantity: row.minimum_order_quantity,
          size: row.products?.size,
          price: Number(row.price),
          quantity: row.stock_quantity,
          delivery: row.delivery_available ? 'Yes' : 'No'
        }));
        setStocks(merchantStocks);
      }

      // Fetch this merchant's orders, with items (+ product names), the
      // buyer's name, and every payment attempt made against the order
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select(`
          *,
          order_items ( quantity, unit_price, products ( name ) ),
          payments ( id, status, amount, receipt_path, rejection_reason, created_at ),
          buyer:profiles!orders_buyer_id_fkey ( full_name )
        `)
        .eq('merchant_id', activeMerchantId)
        .order('created_at', { ascending: false });

      let merchantOrders = [];
      if (!orderErr && orderData) {
        merchantOrders = orderData.map(o => {
          const latestPayment = (o.payments || []).slice().sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          )[0] || null;
          const firstItem = (o.order_items || [])[0];
          return {
            ...o,
            displayNumber: `ORD-${o.id.slice(0, 8).toUpperCase()}`,
            buyer_name: o.buyer?.full_name || 'Unknown buyer',
            product_name: firstItem?.products?.name || '—',
            quantity: firstItem?.quantity || 0,
            payment: latestPayment
          };
        });
        setOrders(merchantOrders);
      }

      updateStats(merchantStocks, merchantOrders);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (currentStocks, currentOrders) => {
    const pendingCount = currentOrders.filter(
      o => o.status === 'pending_payment' && o.payment?.status === 'pending'
    ).length;
    const totalEarnings = currentOrders
      .filter(o => o.status === 'confirmed' || o.payment?.status === 'verified')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    setStats({
      products: currentStocks.length,
      pendingOrders: pendingCount,
      earnings: totalEarnings
    });
  };

  // ================= INVENTORY FORM ACTIONS =================
  const resolveMerchantId = async () => {
    if (activeMerchantId) return activeMerchantId;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user?.id) throw new Error('Your merchant session has expired. Please sign in again.');

    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (merchantError) throw merchantError;
    if (merchant?.id) return merchant.id;

    const { data: createdMerchant, error: createError } = await supabase
      .from('merchants')
      .insert({
        owner_id: user.id,
        business_name: `${user.user_metadata?.full_name || 'Merchant'} Store`,
        phone: user.user_metadata?.phone || null,
        is_active: true
      })
      .select('id')
      .single();
    if (createError || !createdMerchant?.id) {
      throw createError || new Error('Unable to create a merchant profile for this account.');
    }
    return createdMerchant.id;
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStockForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 'Yes' : 'No') : value
    }));
  };

  const updateWizardField = (name, value) => setStockForm(prev => ({ ...prev, [name]: value }));

  const handleExistingProductSelect = (productId) => {
    const product = catalog.find(item => item.id === productId || `${item.name} · ${item.paper_weight_gsm || item.gsm} GSM` === productId);
    if (!product) {
      return;
    }
    setExistingProductSearch(`${product.name} · ${product.paper_weight_gsm || product.gsm} GSM`);
    updateWizardField('productId', product.id);
    setStockForm(prev => ({
      ...prev,
      productId: product.id,
      name: product.name || '',
      description: product.description || '',
      paperFamily: product.paper_family || '',
      paperSubType: product.paper_sub_type || '',
      paperWeightGsm: product.paper_weight_gsm || product.gsm || '',
      finish: product.finish || '',
      paperSize: product.paper_size || product.size || '',
      printUseCase: product.print_use_case || '',
      printingType: product.printing_type || 'Single Side',
      colorOption: product.color_option || 'Full Color',
      productionTime: product.production_time || '2-3 Days',
      price: product.inventory_price || product.price || prev.price,
      currency: product.currency || 'NGN',
      priceUnit: product.price_unit || 'Per Piece',
      quantity: product.inventory_quantity ?? prev.quantity,
      minimumQuantity: product.inventory_minimum_quantity ?? product.minimum_quantity ?? prev.minimumQuantity,
      delivery: product.inventory_delivery === undefined ? prev.delivery : (product.inventory_delivery ? 'Yes' : 'No')
    }));
    setProductImageFile(null);
    setProductImagePreview(product.image_url || null);
    setSelectedGsm([Number(product.paper_weight_gsm || product.gsm)]);
    setGsmPrices({ [Number(product.paper_weight_gsm || product.gsm)]: product.inventory_price || product.price || '' });
  };

  const handleInventoryCategoryChange = (event) => {
    const category = event.target.value;
    setStockForm(prev => ({
      ...prev,
      category,
      paperFamily: '',
      paperSubType: '',
      paperWeightGsm: '',
      finish: '',
      paperSize: '',
      printUseCase: ''
    }));
    setSelectedGsm([]);
    setGsmPrices({});
  };

  const availablePaperTypes = paperTypes.filter(type => {
    if (stockForm.category === 'ART') return type.family === 'Coated Art';
    if (stockForm.category === 'OFFSET') return type.family === 'Uncoated Offset';
    return stockForm.category === 'PAPER';
  });

  const toggleGsm = (weight) => {
    setSelectedGsm(prev => prev.includes(weight) ? prev.filter(item => item !== weight) : [...prev, weight]);
  };

  const validateWizardStep = () => {
    if (!stockForm.category || !String(stockForm.name || '').trim()) {
      alert('Select an inventory category and enter a product name.');
      return false;
    }
    if (!stockForm.paperFamily || !stockForm.paperSubType || !stockForm.finish || selectedGsm.length === 0) {
      alert('Complete the paper specifications and select at least one GSM.');
      return false;
    }
    if (!stockForm.productionTime || !stockForm.quantity || selectedGsm.some(weight => !gsmPrices[weight])) {
      alert('Enter production time, stock quantity, and a price for every selected GSM.');
      return false;
    }
    return true;
  };

  const handleWizardNext = () => {
    return validateWizardStep();
  };

  const handleWizardSubmit = async (event) => {
    event.preventDefault();
    if (!validateWizardStep()) return;
    setUploading(true);
    try {
      const listingMerchantId = await resolveMerchantId();
      let productIds = [];
      {
        const productRows = selectedGsm.map(weight => ({
          name: stockForm.name,
          description: stockForm.description,
          category: stockForm.category,
          paper_family: stockForm.paperFamily,
          paper_sub_type: stockForm.paperSubType,
          paper_weight_gsm: Number(weight),
          finish: stockForm.finish,
          paper_size: stockForm.paperSize,
          print_use_case: stockForm.printUseCase,
          use_cases: stockForm.printUseCase ? [stockForm.printUseCase] : [],
          printing_type: stockForm.printingType,
          color_option: stockForm.colorOption,
          production_time: stockForm.productionTime,
          gsm: Number(weight),
          size: stockForm.paperSize
        }));
        const { data: products, error: productError } = await supabase.from('products').insert(productRows).select('id');
        if (productError) throw productError;
        productIds = (products || []).map(product => product.id);
        if (productImageFile) {
          const imageUrl = await uploadProductImage(await compressImage(productImageFile), productIds[0]);
          await Promise.all(productIds.map(async (productId) => {
            const { error: imageError } = await supabase.from('products').update({ image_url: imageUrl }).eq('id', productId);
            if (imageError) throw imageError;
          }));
        }
      }

      const inventoryRows = productIds.map((productId, index) => ({
        merchant_id: listingMerchantId,
        product_id: productId,
        price: Number(gsmPrices[selectedGsm[index]] || stockForm.price),
        stock_quantity: Number(stockForm.quantity),
        minimum_order_quantity: Number(stockForm.minimumQuantity),
        delivery_available: stockForm.delivery === 'Yes',
        is_active: true
      }));
      const { error: inventoryError } = await supabase.from('inventory').insert(inventoryRows);
      if (inventoryError) throw inventoryError;
      alert(`${inventoryRows.length} paper variant${inventoryRows.length === 1 ? '' : 's'} listed successfully!`);
      resetStockForm();
      setWizardStep(1);
      setSelectedGsm([]);
      setGsmPrices({});
      setExistingProductSearch('');
      setProductImageFile(null);
      setProductImagePreview(null);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error saving wizard listing:', error);
      alert(error.message || 'Failed to save this listing. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (stockForm.productMode === 'existing' && !stockForm.productId) {
      alert('Please select a paper specification.');
      return;
    }
    if (stockForm.productMode === 'new' && (!stockForm.name || !stockForm.paperFamily || !stockForm.paperSubType || !stockForm.paperWeightGsm || !stockForm.finish || !stockForm.printUseCase)) {
      alert('Complete the product name, paper family, subtype, weight, finish, and print use case.');
      return;
    }
    try {
      let productId = stockForm.productId;

      if (!isEditingStock && stockForm.productMode === 'new') {
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert([{
            name: stockForm.name,
            description: stockForm.description,
            category: stockForm.category,
            paper_family: stockForm.paperFamily,
            paper_sub_type: stockForm.paperSubType,
            paper_weight_gsm: Number(stockForm.paperWeightGsm),
            finish: stockForm.finish,
            paper_size: stockForm.paperSize,
            print_use_case: stockForm.printUseCase,
            use_cases: [stockForm.printUseCase],
            printing_type: stockForm.printingType,
            color_option: stockForm.colorOption,
            minimum_quantity: Number(stockForm.minimumQuantity),
            production_time: stockForm.productionTime,
            price: Number(stockForm.price),
            currency: stockForm.currency,
            price_unit: stockForm.priceUnit,
            gsm: Number(stockForm.paperWeightGsm),
            size: stockForm.paperSize || 'A4'
          }])
          .select('id')
          .single();

        if (productError) throw productError;
        productId = product.id;

        if (productImageFile) {
          const imageUrl = await uploadProductImage(await compressImage(productImageFile), productId);
          const { error: imageError } = await supabase.from('products').update({ image_url: imageUrl }).eq('id', productId);
          if (imageError) throw imageError;
        }
      }

      if (isEditingStock && editingStockId) {
        // Update stock (price/quantity/delivery only — the underlying
        // product spec isn't editable; de-list and re-add for that)
        const { error } = await supabase
          .from('inventory')
          .update({
            price: Number(stockForm.price),
            stock_quantity: Number(stockForm.quantity),
            minimum_order_quantity: Number(stockForm.minimumQuantity),
            delivery_available: stockForm.delivery === 'Yes'
          })
          .eq('id', editingStockId);

        if (error) throw error;
        alert('Inventory specification updated successfully!');
      } else {
        const listingMerchantId = await resolveMerchantId();
        // Add new stock listing against an existing product variant
        const { error } = await supabase
          .from('inventory')
          .insert([{
            merchant_id: listingMerchantId,
            product_id: productId,
            price: Number(stockForm.price),
            stock_quantity: Number(stockForm.quantity),
            minimum_order_quantity: Number(stockForm.minimumQuantity),
            delivery_available: stockForm.delivery === 'Yes',
            is_active: true
          }]);

        if (error) throw error;
        alert('New inventory specification listed!');
      }

      // Reset form & reload
      resetStockForm();
      setProductImageFile(null);
      setProductImagePreview(null);
      setIsEditingStock(false);
      setEditingStockId(null);
      await fetchDashboardData();
    } catch (err) {
      console.error('Error saving stock:', err);
      alert('Failed to save this listing. Please try again.');
    }
  };

  const handleEditClick = (stock) => {
    setStockForm({
      productId: stock.product_id,
      productMode: 'existing',
      name: stock.name || '',
      description: stock.description || '',
      category: stock.paperFamily === 'Coated Art' ? 'ART' : stock.paperFamily === 'Uncoated Offset' ? 'OFFSET' : 'PAPER',
      paperFamily: stock.paperFamily || '',
      paperSubType: stock.paperSubType || '',
      paperWeightGsm: stock.paperWeightGsm || stock.gsm || '',
      finish: stock.finish || '',
      paperSize: stock.paperSize || stock.size || '',
      printUseCase: stock.printUseCase || '',
      printingType: stock.printingType || 'Single Side',
      colorOption: stock.colorOption || 'Full Color',
      productionTime: stock.productionTime || '2-3 Days',
      price: stock.price,
      currency: stock.currency || 'NGN',
      priceUnit: stock.priceUnit || 'Per Piece',
      minimumQuantity: stock.minimum_order_quantity || 100,
      quantity: stock.quantity,
      delivery: stock.delivery || 'Yes'
    });
    setSelectedGsm([Number(stock.paperWeightGsm || stock.gsm)]);
    setGsmPrices({ [Number(stock.paperWeightGsm || stock.gsm)]: stock.price || '' });
    setExistingProductSearch(`${stock.name} · ${stock.paperWeightGsm || stock.gsm} GSM`);
    setWizardStep(1);
    setIsEditingStock(true);
    setEditingStockId(stock.id);
    setActiveTab('inventory'); // focus on form tab
  };

  const resetStockForm = () => setStockForm({
    productId: '',
    productMode: 'existing',
    name: '',
    description: '',
    category: '',
    paperFamily: '',
    paperSubType: '',
    paperWeightGsm: '',
    finish: '',
    paperSize: '',
    printUseCase: '',
    printingType: 'Single Side',
    colorOption: 'Full Color',
    minimumQuantity: 100,
    productionTime: '2-3 Days',
    price: 18500,
    currency: 'NGN',
    priceUnit: 'Per Piece',
    quantity: 150,
    delivery: 'Yes'
  });

  const handleProductImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      alert('Please select an image under 2MB.');
      return;
    }
    setProductImageFile(file);
    setProductImagePreview(URL.createObjectURL(file));
  };

  const handleDeleteStock = async (stockId) => {
    if (!confirm('Are you sure you want to de-list this inventory?')) return;
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', stockId);

      if (error) throw error;
      await fetchDashboardData();
    } catch (err) {
      console.error('Error deleting stock:', err);
    }
  };

  // ================= PAYMENT VERIFICATION ACTIONS =================
  const handleVerifyPayment = async (paymentId, approve) => {
    try {
      const { error } = await supabase.rpc(
        approve ? 'merchant_verify_payment' : 'merchant_reject_payment',
        approve ? { p_payment_id: paymentId } : { p_payment_id: paymentId, p_reason: null }
      );

      if (error) throw error;
      alert(approve ? 'Deposit verified! Ledger settled.' : 'Payment proof rejected.');
      setViewingReceiptOrder(null);
      await fetchDashboardData();
    } catch (err) {
      console.error('Error verifying payment:', err);
      alert(err.message || 'Could not process this verification.');
    }
  };

  const selectedPaperType = availablePaperTypes.find(type => type.family === stockForm.paperFamily);

  const handleMerchantSetup = async (event) => {
    event.preventDefault();
    if (!businessName.trim()) return;
    setMerchantSetup(prev => ({ ...prev, status: 'checking', error: '' }));
    try {
      const { data: ensuredMerchantId, error } = await supabase.rpc(
        'ensure_merchant_profile',
        { business_name: businessName.trim() }
      );
      if (error) throw error;
      if (!ensuredMerchantId) throw new Error('A merchant profile could not be created.');
      setMerchantSetup({ status: 'ready', id: ensuredMerchantId, error: '' });
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) sessionStorage.setItem(`merchant_profile_id:${user.id}`, ensuredMerchantId);
    } catch (error) {
      setMerchantSetup({ status: 'needs_setup', id: null, error: error.message || 'Unable to set up your business.' });
    }
  };

  if (merchantSetup.status === 'checking') {
    return (
      <div className="flex justify-center items-center h-screen bg-[#F8F8F6]">
        <Loader className="w-8 h-8 animate-spin text-[#0B1F3A]" />
      </div>
    );
  }

  if (merchantSetup.status === 'needs_setup' || merchantSetup.status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] p-6">
        <form onSubmit={handleMerchantSetup} className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
          <h1 className="text-xl font-bold text-[#0B1F3A]">Set up your business</h1>
          <p className="text-sm text-slate-500 mt-2">Complete this once before adding inventory to the Supplier Hub.</p>
          {merchantSetup.error && <p className="text-sm text-red-600 mt-4">{merchantSetup.error}</p>}
          <label className="field-label block mt-5">Business Name *</label>
          <input
            value={businessName}
            onChange={event => setBusinessName(event.target.value)}
            required
            autoFocus
            className="wizard-input"
            placeholder="Your business name"
          />
          <button type="submit" className="mt-5 w-full px-5 py-3 bg-[#0B1F3A] text-white rounded-xl text-sm font-bold">
            Continue to Supplier Hub
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#F8F8F6]">
        <Loader className="w-8 h-8 animate-spin text-[#0B1F3A]" />
      </div>
    );
  }

  // Find all pending payments with receipts
  const pendingPayments = orders.filter(o => o.status === 'pending_payment' && o.payment?.status === 'pending');

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#1E293B] font-sans pb-16">
      
      {/* Top Main Navbar */}
      <header className="bg-[#0B1F3A] text-white py-5 px-6 sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white overflow-hidden shadow-sm shrink-0">
              <img src={logoMark} alt="" aria-hidden="true" className="w-full h-full object-cover rounded-full" />
            </div>
            <div>
              <h1 className="text-base font-black font-display tracking-tight text-white leading-none">
                Printers Companion
              </h1>
              <span className="text-[9px] font-mono tracking-widest text-[#00C2FF] uppercase font-bold">Supplier Hub</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={fetchDashboardData}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-300 transition-colors"
              title="Refresh Ledger"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-3 py-1.5 border border-white/20 hover:border-white text-xs font-bold rounded-xl transition-all"
            >
              Exit to Portal
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">

        {/* Tab Selection Row */}
        <div className="flex border-b border-[#E2E8F0] gap-6">
          <button
            onClick={() => { setActiveTab('overview'); setIsEditingStock(false); }}
            className={`pb-3 text-xs uppercase tracking-wider font-bold transition-all font-mono border-b-2 ${
              activeTab === 'overview' 
                ? 'border-[#0B1F3A] text-[#0B1F3A]' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 text-xs uppercase tracking-wider font-bold transition-all font-mono border-b-2 ${
              activeTab === 'inventory' 
                ? 'border-[#0B1F3A] text-[#0B1F3A]' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Inventory Management
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 text-xs uppercase tracking-wider font-bold transition-all font-mono border-b-2 ${
              activeTab === 'orders' 
                ? 'border-[#0B1F3A] text-[#0B1F3A]' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Orders & Verification {pendingPayments.length > 0 && (
              <span className="bg-[#E53935] text-white text-[8px] px-1.5 py-0.5 rounded-full animate-pulse ml-1">
                {pendingPayments.length}
              </span>
            )}
          </button>
        </div>


        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Merchant Intro card */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#00C2FF]/5 to-[#E53935]/5 rounded-full -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[9px] font-bold border border-amber-100 mb-2 font-mono uppercase">
                  <Sparkles className="w-3 h-3 text-[#E53935]" /> Premium Ledger Connected
                </div>
                <h2 className="text-xl font-bold font-display text-[#0B1F3A]">Welcome, Premium Paper Co</h2>
                <p className="text-slate-500 text-sm mt-1">Configure your paper specifications below and view realtime buyer payment transfers.</p>
              </div>
            </div>

            {/* Bento Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Active Inventory</span>
                  <p className="text-2xl font-black text-[#0B1F3A] font-mono mt-1">{stats.products}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-[#00C2FF]">
                  <Package className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm flex items-center justify-between relative overflow-hidden">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Pending Deposits</span>
                  <p className="text-2xl font-black text-[#E53935] font-mono mt-1">{stats.pendingOrders}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#E53935]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Fintech Earnings</span>
                  <p className="text-2xl font-black text-[#0B1F3A] font-mono mt-1">₦{stats.earnings.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Active notifications for pending receipts */}
            {pendingPayments.length > 0 && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-[#0B1F3A]">Awaiting Bank Deposit Validations</h4>
                    <p className="text-xs text-amber-800">You have {pendingPayments.length} buyer transfer receipts awaiting verification in your GTBank ledger.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="px-3 py-1.5 bg-[#0B1F3A] hover:bg-[#16365C] text-white rounded-lg text-xs font-bold font-mono uppercase flex items-center gap-1 shrink-0"
                >
                  <span>Verify Now</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#00C2FF]" />
                </button>
              </div>
            )}

            {/* Recent Orders log widget */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E2E8F0] bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xs font-black font-display text-[#0B1F3A] uppercase tracking-wider">Live Procurement Log</h3>
                <span className="text-[10px] font-mono font-bold text-slate-400">Showing last 4 orders</span>
              </div>
              <div className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-400">No print orders recorded yet.</p>
                ) : (
                  orders.slice(0, 4).map(o => (
                    <div key={o.id} className="p-4 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-[#0B1F3A] font-mono">{o.displayNumber}</p>
                        <p className="text-slate-500 mt-0.5">{o.product_name} • {o.quantity} reams</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#0B1F3A]">₦{Number(o.total)?.toLocaleString()}</p>
                        <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded mt-1 font-mono ${
                          o.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                          o.payment?.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}


        {/* ================= TAB 2: INVENTORY MANAGEMENT ================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-fade-in">
            {/* STRUCTURED ADD/EDIT INVENTORY FORM */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b pb-4">
                <div className="w-8 h-8 rounded-lg bg-[#0B1F3A] text-[#00C2FF] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0B1F3A] font-display">
                    {isEditingStock ? 'Modify Material Listing' : 'Add New Product'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">Fill in fields to populate regional price index instantly</p>
                </div>
              </div>

              <form onSubmit={handleWizardSubmit} className="space-y-6">
                <div className="border-b border-[#E2E8F0] pb-5">
                  <label className="field-label">Inventory Category *</label>
                  <select name="category" value={stockForm.category} onChange={handleInventoryCategoryChange} required className="wizard-input">
                    <option value="">Select inventory category</option>
                    <option value="PAPER">PAPER</option>
                    <option value="ART">ART</option>
                    <option value="OFFSET">OFFSET</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-2">Choose a category to load its paper specifications.</p>
                </div>

                <div className="space-y-4">
                    <div><label className="field-label">Product Name *</label><input name="name" value={stockForm.name} onChange={handleFormChange} required className="wizard-input" placeholder="Premium Business Paper" /></div>
                </div>

                {stockForm.category && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="field-label">Paper Family *</label><select name="paperFamily" value={stockForm.paperFamily} onChange={(event) => setStockForm(prev => ({ ...prev, paperFamily: event.target.value, paperSubType: '', finish: '', paperSize: '', printUseCase: '', paperWeightGsm: '' }))} required className="wizard-input"><option value="">Select paper family</option>{availablePaperTypes.map(type => <option key={type.family}>{type.family}</option>)}</select></div>
                      <div><label className="field-label">Paper Type *</label><select name="paperSubType" value={stockForm.paperSubType} onChange={handleFormChange} required disabled={!selectedPaperType} className="wizard-input"><option value="">Select paper type</option>{(selectedPaperType?.subTypes || []).map(type => <option key={type}>{type}</option>)}</select></div>
                      <div><label className="field-label">Finish *</label><select name="finish" value={stockForm.finish} onChange={handleFormChange} required disabled={!selectedPaperType} className="wizard-input"><option value="">Select finish</option>{(selectedPaperType?.finishes || FINISHES).map(finish => <option key={finish}>{finish}</option>)}</select></div>
                    </div>
                    <div><p className="field-label">Available GSM and Price per Ream *</p><div className="space-y-2">{(selectedPaperType?.weights || []).map(weight => <div key={weight} className="flex items-center gap-3 border border-[#E2E8F0] rounded-xl p-3"><input type="checkbox" checked={selectedGsm.includes(weight)} onChange={() => toggleGsm(weight)} className="w-4 h-4" /><span className="text-sm font-bold text-[#0B1F3A] w-20">{weight} GSM</span>{selectedGsm.includes(weight) ? <input type="number" min="1" required value={gsmPrices[weight] || ''} onChange={(event) => setGsmPrices(prev => ({ ...prev, [weight]: event.target.value }))} placeholder="Price per ream" className="flex-1 p-2 border border-[#E2E8F0] rounded-lg text-sm" /> : <span className="text-xs text-slate-400">Select to enter price</span>}</div>)}</div></div>
                  </div>
                )}

                {stockForm.category && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="field-label">Production Time</label><input name="productionTime" value={stockForm.productionTime} onChange={handleFormChange} className="wizard-input" placeholder="2-3 Days" /></div>
                      <div><label className="field-label">Printing Type *</label><select name="printingType" value={stockForm.printingType} onChange={handleFormChange} className="wizard-input">{PRINTING_TYPES.map(type => <option key={type}>{type}</option>)}</select></div>
                      <div><label className="field-label">Stock Quantity (Reams) *</label><input type="number" min="1" name="quantity" value={stockForm.quantity} onChange={handleFormChange} required className="wizard-input" /></div>
                      <div><label className="field-label">Minimum Order Quantity *</label><input type="number" min="1" name="minimumQuantity" value={stockForm.minimumQuantity} onChange={handleFormChange} required className="wizard-input" /></div>
                      <div><label className="field-label">Currency</label><select name="currency" value={stockForm.currency} onChange={handleFormChange} className="wizard-input">{CURRENCIES.map(currency => <option key={currency}>{currency}</option>)}</select></div>
                      <div><label className="field-label">Price Unit</label><select name="priceUnit" value={stockForm.priceUnit} onChange={handleFormChange} className="wizard-input">{PRICE_UNITS.map(unit => <option key={unit}>{unit}</option>)}</select></div>
                    </div>
                    <label className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3 border text-xs font-bold text-slate-700"><input type="checkbox" checked={stockForm.delivery === 'Yes'} onChange={handleFormChange} name="delivery" className="w-4 h-4" /> Provide regional delivery</label>
                  </div>
                )}

                <div className="flex justify-between gap-3 pt-3">
                  <button type="button" onClick={() => { setIsEditingStock(false); resetStockForm(); }} className="px-5 py-2.5 border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-600">Cancel</button>
                  <button type="submit" disabled={uploading || !stockForm.category} className="px-5 py-2.5 bg-[#E53935] text-white rounded-xl text-xs font-bold disabled:opacity-50">{uploading ? 'Submitting...' : 'Submit Listing'}</button>
                </div>
              </form>

              <form onSubmit={handleSaveStock} className="hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex gap-2 border-b border-[#E2E8F0] pb-4">
                  <button
                    type="button"
                    onClick={() => setStockForm(prev => ({ ...prev, productMode: 'new', productId: '' }))}
                    disabled={isEditingStock}
                    className={`px-3 py-2 rounded-lg text-xs font-bold ${stockForm.productMode === 'new' ? 'bg-[#0B1F3A] text-white' : 'bg-slate-100 text-slate-500'} disabled:opacity-50`}
                  >
                    Create Marketplace Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockForm(prev => ({ ...prev, productMode: 'existing' }))}
                    disabled={isEditingStock}
                    className={`px-3 py-2 rounded-lg text-xs font-bold ${stockForm.productMode === 'existing' ? 'bg-[#0B1F3A] text-white' : 'bg-slate-100 text-slate-500'} disabled:opacity-50`}
                  >
                    Use Existing Product
                  </button>
                </div>

                {stockForm.productMode === 'new' && !isEditingStock ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Product Name *</label>
                      <input name="name" value={stockForm.name} onChange={handleFormChange} required className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold" placeholder="Premium Business Cards" />
                    </div>
                    <div />
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Product Description</label>
                      <textarea name="description" value={stockForm.description} onChange={handleFormChange} rows="2" className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold" placeholder="Describe the product for buyers..." />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Product Image</label>
                      <input type="file" accept="image/*" onChange={handleProductImageSelect} className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm" />
                      {productImagePreview && <img src={productImagePreview} alt="Product preview" className="mt-2 h-24 w-24 rounded-lg object-cover" />}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Paper Family *</label>
                      <select name="paperFamily" value={stockForm.paperFamily} onChange={(e) => setStockForm(prev => ({ ...prev, paperFamily: e.target.value, paperSubType: '', paperWeightGsm: '', finish: '', paperSize: '' }))} required className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold">
                        <option value="">Select paper family</option>
                        {paperTypes.map(type => <option key={type.family}>{type.family}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Paper Type *</label>
                      <select name="paperSubType" value={stockForm.paperSubType} onChange={handleFormChange} required disabled={!selectedPaperType} className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold disabled:opacity-50">
                        <option value="">{selectedPaperType ? 'Select paper type' : 'Select family first'}</option>
                        {(selectedPaperType?.subTypes || []).map(type => <option key={type}>{type}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Paper Weight *</label>
                      <select name="paperWeightGsm" value={stockForm.paperWeightGsm} onChange={handleFormChange} required disabled={!selectedPaperType} className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold disabled:opacity-50">
                        <option value="">{selectedPaperType ? 'Select weight' : 'Select family first'}</option>
                        {(selectedPaperType?.weights || []).map(weight => <option key={weight} value={weight}>{weight} GSM</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Finish *</label>
                      <select name="finish" value={stockForm.finish} onChange={handleFormChange} required disabled={!selectedPaperType} className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold disabled:opacity-50">
                        <option value="">{selectedPaperType ? 'Select finish' : 'Select family first'}</option>
                        {(selectedPaperType?.finishes || FINISHES).map(finish => <option key={finish}>{finish}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Sheet Size</label>
                      <select name="paperSize" value={stockForm.paperSize} onChange={handleFormChange} disabled={!selectedPaperType} className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold disabled:opacity-50">
                        <option value="">Select size</option>
                        {(selectedPaperType?.sizes || PAPER_SIZES).map(size => <option key={size}>{size}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Print Use Case *</label>
                      <select name="printUseCase" value={stockForm.printUseCase} onChange={handleFormChange} required className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold">
                        <option value="">Select use case</option>
                        {(selectedPaperType?.printUseCases || PRINT_USE_CASES).map(useCase => <option key={useCase}>{useCase}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Production Time</label>
                      <input name="productionTime" value={stockForm.productionTime} onChange={handleFormChange} className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold" placeholder="2-3 Days" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Printing Type</label>
                      <select name="printingType" value={stockForm.printingType} onChange={handleFormChange} className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold">
                        {PRINTING_TYPES.map(type => <option key={type}>{type}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Color Option</label>
                      <select name="colorOption" value={stockForm.colorOption} onChange={handleFormChange} className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold">
                        {COLOR_OPTIONS.map(option => <option key={option}>{option}</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Existing Marketplace Product</label>
                    <select name="productId" value={stockForm.productId} onChange={handleFormChange} disabled={isEditingStock} required className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold text-[#1E293B] disabled:opacity-60">
                      <option value="">Select a product specification</option>
                      {catalog.filter(p => p.paper_family && p.paper_weight_gsm && p.print_use_case).map(p => <option key={p.id} value={p.id}>{p.name} — {p.paper_family} · {p.paper_weight_gsm} GSM · {p.print_use_case}</option>)}
                    </select>
                  </div>
                )}

                {/* Product Variant Dropdown (legacy catalog compatibility) */}
                {/*
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Paper Specification</label>
                  <select
                    name="productId"
                    value={stockForm.productId}
                    onChange={handleFormChange}
                    disabled={isEditingStock}
                    required
                    className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold text-[#1E293B] disabled:opacity-60"
                  >
                    <option value="" disabled>Select a paper specification…</option>
                    {catalog.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {p.gsm}gsm · {p.size}</option>
                    ))}
                  </select>
                  {isEditingStock && (
                    <p className="text-[10px] text-slate-400 mt-1">To change the paper spec, de-list this and add a new listing.</p>
                  )}
                </div>
                */}

                {/* Price */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={stockForm.price}
                    onChange={handleFormChange}
                    placeholder="e.g. 150"
                    required
                    className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold text-[#1E293B]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Price Unit</label>
                  <select name="priceUnit" value={stockForm.priceUnit} onChange={handleFormChange} className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold">
                    {PRICE_UNITS.map(unit => <option key={unit}>{unit}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Currency</label>
                  <select name="currency" value={stockForm.currency} onChange={handleFormChange} className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold">
                    {CURRENCIES.map(currency => <option key={currency}>{currency}</option>)}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase font-mono">Stock Volume (Reams)</label>
                  <input
                    type="number"
                    name="quantity"
                    value={stockForm.quantity}
                    onChange={handleFormChange}
                    placeholder="e.g. 500"
                    required
                    className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#00C2FF] text-sm font-semibold text-[#1E293B]"
                  />
                </div>

                {/* Delivery Toggle Checkbox */}
                <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3 md:col-span-2 border">
                  <input
                    type="checkbox"
                    id="delivery"
                    name="delivery"
                    checked={stockForm.delivery === 'Yes'}
                    onChange={handleFormChange}
                    className="w-4 h-4 rounded text-[#0B1F3A] focus:ring-[#00C2FF] cursor-pointer"
                  />
                  <label htmlFor="delivery" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                    Provide Regional Truck Dispatch/Delivery option for this specification
                  </label>
                </div>

                {/* Buttons */}
                <div className="md:col-span-2 flex justify-end gap-3 pt-3">
                  {isEditingStock && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingStock(false);
                        setEditingStockId(null);
                        resetStockForm();
                      }}
                      className="px-4 py-2.5 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0B1F3A] hover:bg-[#16365C] text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    {isEditingStock ? 'Save Changes' : 'Publish Stock Offer'}
                  </button>
                </div>
              </form>
            </div>

            {/* SUPPLIER STOCKS INVENTORY TABLE */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E2E8F0] bg-slate-50/50">
                <h3 className="text-xs font-black font-display text-[#0B1F3A] uppercase tracking-wider">Active Catalog listings</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-slate-100/50 text-[10px] font-mono text-slate-400 font-bold uppercase">
                      <th className="p-4">Material Details</th>
                      <th className="p-4 text-center">Weight</th>
                      <th className="p-4">Dispatch Logistics</th>
                      <th className="p-4 text-right">Available Volume</th>
                      <th className="p-4 text-right">Unit Price</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-xs font-semibold">
                    {stocks.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-400">No stocks registered. Use the form above to add paper stock.</td>
                      </tr>
                    ) : (
                      stocks.map(s => {
                        const isLowStock = s.quantity < 50;
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-[#0B1F3A]">{s.name}</p>
                              <span className="text-[10px] font-mono text-slate-400 font-bold">{s.size || '700×1000mm'}</span>
                            </td>
                            <td className="p-4 text-center font-mono">{s.gsm}gsm</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono ${
                                s.delivery === 'Yes' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                              }`}>
                                <Truck className="w-3 h-3" /> Delivery: {s.delivery || 'Yes'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {/* LOW STOCK UX: Show quantity if low, hide if sufficient */}
                              {isLowStock ? (
                                <span className="text-[#E53935] font-black font-mono flex items-center justify-end gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Only {s.quantity} left!
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono font-bold">Sufficient</span>
                              )}
                            </td>
                            <td className="p-4 text-right font-bold text-[#0B1F3A] font-mono">
                              ₦{Number(s.price || 0).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2 justify-center">
                                <button 
                                  onClick={() => handleEditClick(s)}
                                  className="p-1.5 border hover:border-slate-300 text-slate-600 rounded-lg bg-white"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteStock(s.id)}
                                  className="p-1.5 border border-red-100 hover:border-red-300 text-red-600 rounded-lg bg-red-50"
                                  title="De-list"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* ================= TAB 3: ORDERS & VERIFICATION ================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            {/* PAYMENT VERIFICATION PANEL (High priority alert queue) */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b pb-4 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#E53935] text-white flex items-center justify-center shadow-sm">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0B1F3A] font-display">Deposit Verification Terminal</h3>
                  <p className="text-xs text-slate-400 font-mono">Audit bank transfer receipts against your GTBank ledger credits</p>
                </div>
              </div>

              {pendingPayments.length === 0 ? (
                <div className="p-8 text-center bg-[#F8F8F6] rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono">Ledger is balanced</p>
                  <p className="text-xs text-slate-400 mt-1">No pending deposit transfer proofs are in your verification queue.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingPayments.map(order => (
                    <div 
                      key={order.id}
                      className="bg-slate-50/50 rounded-xl border border-amber-200 p-4 shadow-sm flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-[8px] font-mono font-bold tracking-widest uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                            Receipt Unchecked
                          </span>
                          <h4 className="font-bold text-sm text-[#0B1F3A] mt-2 font-mono uppercase">{order.displayNumber}</h4>
                          <p className="text-[10px] text-slate-500 mt-1">Buyer: <span className="font-bold">{order.buyer_name}</span></p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm text-[#0B1F3A] font-mono">₦{Number(order.total)?.toLocaleString()}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">{order.product_name}</p>
                        </div>
                      </div>

                      {/* Display Receipt Action button */}
                      <div className="py-2.5 px-3 bg-white rounded-lg border border-slate-100 flex justify-between items-center text-xs mb-4">
                        <span className="text-slate-500 font-semibold flex items-center gap-1.5 font-mono">
                          <Eye className="w-4 h-4 text-sky-400" /> receipt_proof.png
                        </span>
                        
                        <button 
                          onClick={() => setViewingReceiptOrder(order)}
                          className="text-xs font-bold text-[#0B1F3A] hover:text-[#00C2FF] underline"
                        >
                          Audit Document
                        </button>
                      </div>

                      {/* Direct Verification buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleVerifyPayment(order.payment.id, false)}
                          className="py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => handleVerifyPayment(order.payment.id, true)}
                          className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify Deposit</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COMPLETE ORDERS LOG TABLE */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E2E8F0] bg-slate-50/50">
                <h3 className="text-xs font-black font-display text-[#0B1F3A] uppercase tracking-wider">All Procurement Orders</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-slate-100/50 text-[10px] font-mono text-slate-400 font-bold uppercase">
                      <th className="p-4">Order Specs</th>
                      <th className="p-4">Buyer Entity</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Settlement</th>
                      <th className="p-4 text-right">Invoice Sum</th>
                      <th className="p-4 text-center">Log Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-xs font-semibold">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-400">No print orders received yet.</td>
                      </tr>
                    ) : (
                      orders.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-[#0B1F3A] font-mono uppercase">{o.displayNumber}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{o.product_name} • {o.quantity} reams</p>
                          </td>
                          <td className="p-4">
                            <p className="text-slate-700 font-bold">{o.buyer_name}</p>
                            <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{o.delivery_address || 'No address'}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              o.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                              o.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              o.payment?.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                              o.payment?.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {o.payment?.status || 'unpaid'}
                            </span>
                          </td>
                          <td className="p-4 text-right font-black text-[#0B1F3A] font-mono">
                            ₦{Number(o.total)?.toLocaleString()}
                          </td>
                          <td className="p-4 text-center text-slate-400 font-mono text-[10px]">
                            {new Date(o.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ================= OPTIONAL RECEIPT VIEWER LIGHTBOX / MODAL ================= */}
      {viewingReceiptOrder && (
        <div className="fixed inset-0 bg-[#0B1F3A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h4 className="font-bold text-base text-[#0B1F3A] font-display uppercase font-mono">{viewingReceiptOrder.displayNumber}</h4>
                <p className="text-xs text-slate-400">GTBank Instant Deposit Audit</p>
              </div>
              <button 
                onClick={() => setViewingReceiptOrder(null)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-[#0B1F3A] transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-500 flex justify-between">Customer: <span className="text-[#0B1F3A]">{viewingReceiptOrder.buyer_name}</span></p>
              <p className="font-bold text-slate-500 flex justify-between">Material: <span className="text-[#0B1F3A]">{viewingReceiptOrder.product_name}</span></p>
              <p className="font-bold text-slate-500 flex justify-between">Deposit Capital: <span className="text-[#0B1F3A] font-mono font-black">₦{Number(viewingReceiptOrder.total)?.toLocaleString()}</span></p>
            </div>

            {/* Visual receipt proof preview */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner max-h-64 flex items-center justify-center bg-slate-50">
              {viewingReceiptUrl ? (
                <img 
                  src={viewingReceiptUrl} 
                  alt="Uploaded receipt proof document" 
                  className="w-full object-contain max-h-64"
                />
              ) : (
                <Loader className="w-6 h-6 text-slate-300 animate-spin" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleVerifyPayment(viewingReceiptOrder.payment.id, false)}
                className="py-3 border hover:bg-slate-50 text-slate-500 text-xs font-bold rounded-xl"
              >
                Reject Proof
              </button>
              <button
                onClick={() => handleVerifyPayment(viewingReceiptOrder.payment.id, true)}
                className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow"
              >
                Verify Deposit Match
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MerchantDashboard;
