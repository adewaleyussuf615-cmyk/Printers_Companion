import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import logoMark from '../assets/logo-mark.png';
import { supabase } from '../supabaseClient';
import { MARKETPLACE_TEMPLATES, PAPER_FAMILIES, FINISHES, PAPER_SIZES } from '../constants/marketplaceAttributes';
import { 
  Search, SlidersHorizontal, ArrowLeft, MapPin, 
  TrendingUp, Star, Truck, ShoppingCart, ShieldCheck, 
  Printer, ArrowRight, Store, AlertTriangle 
} from 'lucide-react';

const BuyerMarketplace = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtering states
  const [selectedType, setSelectedType] = useState('All');
  const [selectedGsm, setSelectedGsm] = useState('All');
  const [selectedUseCase, setSelectedUseCase] = useState('All');
  const [selectedFinish, setSelectedFinish] = useState('All');
  const [selectedSize, setSelectedSize] = useState('All');

  // Active overlays/sub-screens
  const [selectedProductGroup, setSelectedProductGroup] = useState(null); // Screen 3 Product Detail & Price Intel
  const [selectedMerchantStore, setSelectedMerchantStore] = useState(null); // Screen 4 Merchant Storefront

  const userState = localStorage.getItem('user_location_state') || 'Lagos';
  const userCity = localStorage.getItem('user_location_city') || 'Shomolu';

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id, price, stock_quantity, minimum_order_quantity, delivery_available,
          products ( id, name, gsm, size, use_cases, paper_family, paper_sub_type, paper_weight_gsm, finish, paper_size, print_use_case ),
          merchants ( id, business_name )
        `)
        .eq('is_active', true);

      if (error) throw error;

      const mapped = (data || [])
        .filter(row => row.products && row.merchants)
        .map(row => ({
          id: row.id, // inventory id — this is what checkout uses
          name: row.products.name,
          gsm: row.products.paper_weight_gsm || row.products.gsm,
          paperFamily: row.products.paper_family,
          paperSubType: row.products.paper_sub_type,
          finish: row.products.finish,
          paperSize: row.products.paper_size || row.products.size,
          printUseCase: row.products.print_use_case,
          size: row.products.size,
          useCases: row.products.use_cases || [],
          price: Number(row.price),
          quantity: row.stock_quantity,
          minOrderQuantity: row.minimum_order_quantity || 1,
          delivery: row.delivery_available ? 'Yes' : 'No',
          merchant_id: row.merchants.id,
          merchant_name: row.merchants.business_name,
          merchant_rating: null
        }));

      setStocks(mapped.length > 0 ? mapped : MARKETPLACE_TEMPLATES);
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setStocks(MARKETPLACE_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  // Helper lists for filters
  const getUseCasesForProduct = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('gloss')) return ['Brochures', 'Magazines', 'Posters'];
    if (lowerName.includes('matt')) return ['Business Cards', 'Luxury Packaging', 'Covers'];
    if (lowerName.includes('ncr')) return ['Forms', 'Invoices', 'Receipts'];
    if (lowerName.includes('bond')) return ['Books', 'Letterheads', 'Notebooks'];
    return ['General Print'];
  };

  const getPaperFamilyForProduct = (stock) => {
    if (stock.paperFamily) return stock.paperFamily;
    const lowerName = stock.name.toLowerCase();
    if (lowerName.includes('gloss') || lowerName.includes('matt')) return 'Coated Art';
    if (lowerName.includes('bond')) return 'Uncoated Offset';
    if (lowerName.includes('ncr')) return 'Specialty Paper';
    return null;
  };

  // Map each individual stock to its corresponding use cases (DB value wins;
  // heuristic is just a fallback for older/unseeded rows)
  const stocksWithUseCases = stocks.map(stock => ({
    ...stock,
    paperFamily: getPaperFamilyForProduct(stock),
    useCases: stock.printUseCase
      ? [stock.printUseCase]
      : ((stock.useCases && stock.useCases.length > 0) ? stock.useCases : getUseCasesForProduct(stock.name))
  }));

  const availablePaperTypes = PAPER_FAMILIES.map(type => type.family).filter(type =>
    stocksWithUseCases.some(stock => stock.paperFamily === type)
  );
  const stocksForWeightOptions = selectedType === 'All'
    ? stocksWithUseCases
    : stocksWithUseCases.filter(stock => stock.paperFamily === selectedType);
  const gsmOptions = ['All', ...new Set(
    stocksForWeightOptions
      .map(stock => stock.gsm?.toString())
      .filter(Boolean)
      .sort((a, b) => Number(a) - Number(b))
  )];
  const stocksForFinishOptions = selectedGsm === 'All'
    ? stocksForWeightOptions
    : stocksForWeightOptions.filter(stock => stock.gsm?.toString() === selectedGsm);
  const finishOptions = ['All', ...new Set(stocksForFinishOptions.map(stock => stock.finish).filter(Boolean))];
  const stocksForUseCaseOptions = selectedFinish === 'All'
    ? stocksForFinishOptions
    : stocksForFinishOptions.filter(stock => stock.finish === selectedFinish);
  const useCases = ['All', ...new Set(stocksForUseCaseOptions.flatMap(stock => stock.useCases))];
  const sizeOptions = ['All', ...new Set(stocksForUseCaseOptions.map(stock => stock.paperSize).filter(Boolean))];

  const resetFilters = () => {
    setSelectedType('All');
    setSelectedGsm('All');
    setSelectedUseCase('All');
    setSelectedFinish('All');
    setSelectedSize('All');
    setSearchQuery('');
  };

  // Perform search & filters on base stocks
  const filteredStocks = stocksWithUseCases.filter(stock => {
    const matchesSearch = searchQuery === '' || 
      stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stock.gsm && stock.gsm.toString().includes(searchQuery)) ||
      stock.merchant_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'All' || stock.paperFamily === selectedType;
    const matchesGsm = selectedGsm === 'All' || (stock.gsm && stock.gsm.toString() === selectedGsm);
      const matchesFinish = selectedFinish === 'All' || stock.finish === selectedFinish;
    const matchesUseCase = selectedUseCase === 'All' || stock.useCases.includes(selectedUseCase);
      const matchesSize = selectedSize === 'All' || stock.paperSize === selectedSize;

      return matchesSearch && matchesType && matchesGsm && matchesFinish && matchesUseCase && matchesSize;
  });

  // Group stocks by (Name + GSM) to aggregate multi-merchant listings for Screen 2 Search Grid
  const groupedProductsMap = {};
  filteredStocks.forEach(stock => {
    const key = `${stock.name}-${stock.gsm || '80'}`;
    if (!groupedProductsMap[key]) {
      groupedProductsMap[key] = {
        name: stock.name,
        gsm: stock.gsm || 80,
        size: stock.size || '700×1000mm',
        useCases: stock.useCases,
        listings: []
      };
    }
    groupedProductsMap[key].listings.push(stock);
  });

  const groupedProducts = Object.values(groupedProductsMap);

  // Open Product Detail Screen 3
  const handleViewProductDetails = (productGroup) => {
    setSelectedProductGroup(productGroup);
  };

  // Open Merchant Storefront Screen 4
  const handleViewMerchantStore = (merchantId, merchantName) => {
    const merchantInventory = stocksWithUseCases.filter(stock => stock.merchant_id === merchantId);
    setSelectedMerchantStore({
      id: merchantId,
      name: merchantName,
      location: `${userCity}, ${userState}`,
      inventory: merchantInventory
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#1E293B] pb-24 font-sans relative">
      
      {/* ================= SCREEN 2: PRODUCT SEARCH SCREEN ================= */}
      {!selectedProductGroup && !selectedMerchantStore && (
        <div className="animate-fade-in">
          {/* Main App Bar Header */}
          <header className="bg-[#0B1F3A] pt-7 pb-6 px-4 shadow-md sticky top-0 z-40 border-b border-white/5">
            <div className="max-w-md mx-auto flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white overflow-hidden shadow-sm shrink-0">
                  <img src={logoMark} alt="" aria-hidden="true" className="w-full h-full object-cover rounded-full" />
                </div>
                <div>
                  <h1 className="text-lg font-black font-display tracking-tight text-white leading-none">
                    Printers <span className="text-[#00C2FF] font-light">Companion</span>
                  </h1>
                  <p className="text-[10px] text-slate-300 font-mono mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#E53935]" />
                    <span>Hole in {userCity}, {userState}</span>
                  </p>
                </div>
              </div>
              
              <Link to="/profile" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 text-white hover:bg-white/20 transition-all">
                <Star className="w-4 h-4 text-[#00C2FF]" />
              </Link>
            </div>
          </header>

          {/* Search Box Panel */}
          <div className="bg-white p-4 border-b border-[#E2E8F0] shadow-sm relative z-30">
            <div className="max-w-md mx-auto relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, services..."
                    className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-[#E2E8F0] text-[#1E293B] rounded-xl outline-none focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/10 transition-all text-sm font-semibold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(true)}
                  className="shrink-0 px-3.5 py-3 bg-[#0B1F3A] text-white rounded-xl flex items-center gap-2 text-xs font-bold hover:bg-[#16365C] transition-colors"
                  aria-expanded={showFilters}
                  aria-controls="marketplace-filters"
                >
                  <SlidersHorizontal className="w-4 h-4 text-[#00C2FF]" />
                  <span className="hidden sm:inline">Filter</span>
                </button>
              </div>

              {showFilters && (
                <>
                  <button
                    type="button"
                    aria-label="Close filters"
                    onClick={() => setShowFilters(false)}
                    className="fixed inset-0 bg-[#0B1F3A]/40 sm:hidden"
                  />
                  <div id="marketplace-filters" className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 shadow-2xl sm:absolute sm:top-full sm:bottom-auto sm:right-0 sm:left-auto sm:mt-2 sm:w-[360px] sm:rounded-2xl sm:border sm:border-[#E2E8F0] sm:p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-black text-[#0B1F3A] font-display uppercase tracking-wide">Filter Products</h2>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Narrow the marketplace results</p>
                      </div>
                      <button type="button" onClick={resetFilters} className="text-[10px] font-bold text-[#E53935] uppercase font-mono hover:underline">Reset</button>
                    </div>

                    <div className="space-y-3">
                      <label className="block">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Paper Family</span>
                        <select
                          value={selectedType}
                          onChange={(e) => { setSelectedType(e.target.value); setSelectedGsm('All'); setSelectedFinish('All'); setSelectedUseCase('All'); setSelectedSize('All'); }}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-sm font-semibold text-[#1E293B] outline-none focus:border-[#00C2FF]"
                        >
                          <option value="All">All Paper Families</option>
                          {availablePaperTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                      </label>

                      {selectedType !== 'All' && (
                        <label className="block">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Paper Weight</span>
                          <select
                            value={selectedGsm}
                            onChange={(e) => { setSelectedGsm(e.target.value); setSelectedFinish('All'); setSelectedUseCase('All'); setSelectedSize('All'); }}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-sm font-semibold text-[#1E293B] outline-none focus:border-[#00C2FF]"
                          >
                            {gsmOptions.map(gsm => <option key={gsm} value={gsm}>{gsm === 'All' ? 'All Weights' : `${gsm}gsm`}</option>)}
                          </select>
                        </label>
                      )}

                      {selectedType !== 'All' && selectedGsm !== 'All' && (
                        <label className="block">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Finish</span>
                          <select value={selectedFinish} onChange={(e) => { setSelectedFinish(e.target.value); setSelectedUseCase('All'); setSelectedSize('All'); }} className="w-full px-3 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-sm font-semibold text-[#1E293B] outline-none focus:border-[#00C2FF]">
                            {finishOptions.map(finish => <option key={finish} value={finish}>{finish === 'All' ? 'All Finishes' : finish}</option>)}
                          </select>
                        </label>
                      )}

                      {selectedType !== 'All' && selectedGsm !== 'All' && selectedFinish !== 'All' && (
                        <>
                          <label className="block">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Print Use Case</span>
                            <select value={selectedUseCase} onChange={(e) => { setSelectedUseCase(e.target.value); setSelectedSize('All'); }} className="w-full px-3 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-sm font-semibold text-[#1E293B] outline-none focus:border-[#00C2FF]">
                              {useCases.map(useCase => <option key={useCase} value={useCase}>{useCase === 'All' ? 'All Uses' : useCase}</option>)}
                            </select>
                          </label>
                          <label className="block">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Size</span>
                            <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-sm font-semibold text-[#1E293B] outline-none focus:border-[#00C2FF]">
                              {sizeOptions.map(size => <option key={size} value={size}>{size === 'All' ? 'All Sizes' : size}</option>)}
                            </select>
                          </label>
                        </>
                      )}
                    </div>

                    <button type="button" onClick={() => setShowFilters(false)} className="w-full mt-5 py-2.5 bg-[#0B1F3A] text-white rounded-lg text-xs font-bold">Show {groupedProducts.length} Products</button>
                  </div>
                </>
              )}
            </div>

            {(selectedType !== 'All' || selectedGsm !== 'All' || selectedFinish !== 'All' || selectedUseCase !== 'All' || selectedSize !== 'All') && (
              <div className="max-w-md mx-auto flex flex-wrap gap-2 mt-3">
                {[selectedType !== 'All' && selectedType, selectedGsm !== 'All' && `${selectedGsm} GSM`, selectedFinish !== 'All' && selectedFinish, selectedUseCase !== 'All' && selectedUseCase, selectedSize !== 'All' && selectedSize].filter(Boolean).map((filter, index) => (
                  <button key={`${filter}-${index}`} type="button" onClick={() => {
                    if (index === 0) { setSelectedType('All'); setSelectedGsm('All'); setSelectedFinish('All'); setSelectedUseCase('All'); setSelectedSize('All'); }
                    if (index === 1) { setSelectedGsm('All'); setSelectedFinish('All'); setSelectedUseCase('All'); setSelectedSize('All'); }
                    if (index === 2) { setSelectedFinish('All'); setSelectedUseCase('All'); setSelectedSize('All'); }
                    if (index === 3) { setSelectedUseCase('All'); setSelectedSize('All'); }
                    if (index === 4) setSelectedSize('All');
                  }} className="px-2.5 py-1 bg-[#0B1F3A] text-white rounded-full text-[10px] font-bold inline-flex items-center gap-1.5">
                    {filter}<span aria-hidden="true" className="text-[#00C2FF]">×</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Result Grid */}
          <div className="px-4 pb-6 max-w-md mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-black font-display text-[#0B1F3A] uppercase tracking-wider">AGGREGATED OFFERS</h2>
              <span className="text-xs font-bold text-slate-400 font-mono">({groupedProducts.length} unique specs)</span>
            </div>

            {groupedProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center shadow-sm">
                <p className="text-slate-400 text-sm">No materials match your filter combination.</p>
                <button 
                  onClick={resetFilters}
                  className="mt-3 text-xs font-black text-[#0B1F3A] underline font-mono uppercase"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {groupedProducts.map((group) => {
                  // Find pricing stats across all listings for this product
                  const prices = group.listings.map(l => l.price);
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  const numSuppliers = group.listings.length;

                  return (
                    <div 
                      key={`${group.name}-${group.gsm}`}
                      onClick={() => handleViewProductDetails(group)}
                      className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm hover:shadow-md hover:border-[#00C2FF] transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-base text-[#0B1F3A] group-hover:text-[#00C2FF] transition-colors">{group.name}</h3>
                          <p className="text-xs font-mono text-slate-400 mt-0.5">{group.gsm}gsm • {group.size}</p>
                        </div>
                        <span className="text-[10px] font-bold font-mono px-2 py-1 rounded bg-slate-100 text-[#0B1F3A]">
                          {numSuppliers} Supplier{numSuppliers > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Use cases tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {group.useCases.map((use, idx) => (
                          <span key={idx} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-500 font-mono">
                            {use}
                          </span>
                        ))}
                      </div>

                      {/* Price aggregator footer */}
                      <div className="flex justify-between items-end pt-3 border-t border-slate-100">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">Regional Ledger</p>
                          <p className="font-extrabold text-[#0B1F3A] text-sm">
                            {numSuppliers > 1 ? (
                              <>₦{minPrice.toLocaleString()} - ₦{maxPrice.toLocaleString()}</>
                            ) : (
                              <>₦{minPrice.toLocaleString()}</>
                            )}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A] group-hover:translate-x-1 transition-all">
                          <span className="font-mono">COMPARE</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#00C2FF]" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}


      {/* ================= SCREEN 3: PRODUCT DETAIL + PRICE INTELLIGENCE SCREEN ================= */}
      {selectedProductGroup && !selectedMerchantStore && (
        <div className="animate-fade-in max-w-md mx-auto px-4 py-6">
          {/* Back button */}
          <button 
            onClick={() => setSelectedProductGroup(null)}
            className="flex items-center gap-2 text-xs font-bold uppercase text-[#0B1F3A] hover:text-[#00C2FF] mb-6 font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Discovery</span>
          </button>

          {/* Product Info Summary */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm mb-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#0B1F3A]/5 rounded-full -mr-8 -mt-8" />
            
            <div className="relative z-10">
              <span className="text-[10px] font-mono font-bold uppercase bg-[#0B1F3A] text-[#00C2FF] px-2 py-1 rounded">
                Active Specification
              </span>
              <h2 className="text-2xl font-black font-display tracking-tight text-[#0B1F3A] mt-3">
                {selectedProductGroup.name}
              </h2>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Weight: {selectedProductGroup.gsm}gsm • Size: {selectedProductGroup.size}
              </p>

              <div className="flex flex-wrap gap-1.5 mt-4">
                {selectedProductGroup.useCases.map((use, idx) => (
                  <span key={idx} className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-[#F8F8F6] border border-slate-100 text-slate-600">
                    {use}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Prominent Price Intelligence Section */}
          <div className="bg-white rounded-2xl p-5 border-2 border-[#0B1F3A] shadow-md mb-6 relative overflow-hidden">
            {/* Little circular monogram accent in corner */}
            <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full overflow-hidden opacity-10">
              <img src={logoMark} alt="" aria-hidden="true" className="w-full h-full object-cover rounded-full" />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#E53935]">
                <TrendingUp className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#0B1F3A] font-display uppercase tracking-wider">PrintWhyze Price Ledger</h4>
                <p className="text-[9px] text-slate-400 font-mono uppercase font-bold">Regional Hub Analysis</p>
              </div>
            </div>

            {(() => {
              const prices = selectedProductGroup.listings.map(l => l.price);
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              const averagePrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);

              return (
                <div className="grid grid-cols-3 gap-2 text-center">
                  {/* Lowest Price -> highlighted subtly with a cool badge */}
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 relative">
                    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[7px] font-black tracking-widest text-emerald-700 bg-emerald-200 px-1.5 py-0.5 rounded uppercase">Best Deal</span>
                    <span className="text-[8px] uppercase font-bold tracking-wider text-emerald-700 font-mono block mt-1">Lowest</span>
                    <p className="text-sm font-black text-[#0B1F3A] mt-1 font-mono">₦{minPrice.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 font-mono block">Average</span>
                    <p className="text-sm font-black text-[#0B1F3A] mt-1 font-mono">₦{averagePrice.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 font-mono block">Highest</span>
                    <p className="text-sm font-black text-[#E53935] mt-1 font-mono">₦{maxPrice.toLocaleString()}</p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Merchant Listing Cards Title */}
          <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-black font-display text-[#0B1F3A] uppercase tracking-wider">PRODUCTS FOUND</h2>
              <span className="text-xs font-bold text-slate-400 font-mono">{groupedProducts.length} products</span>
          </div>

          {/* Merchant Listing Cards */}
          <div className="space-y-4">
            {selectedProductGroup.listings.map((listing) => {
              const prices = selectedProductGroup.listings.map(l => l.price);
              const isBestPrice = listing.price === Math.min(...prices);
              const isLowStock = listing.quantity && listing.quantity < 50;

              return (
                <div 
                  key={listing.id}
                  className={`bg-white rounded-xl border p-4 shadow-sm relative transition-all ${
                    isBestPrice ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-[#E2E8F0]'
                  }`}
                >
                  {/* Subtle red/green accent tag */}
                  {isBestPrice && (
                    <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded">
                      Lowest Price
                    </span>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      {/* Merchant name clicks to Screen 4 Storefront */}
                      <button 
                        onClick={() => handleViewMerchantStore(listing.merchant_id, listing.merchant_name)}
                        className="font-bold text-[#0B1F3A] hover:text-[#00C2FF] flex items-center gap-1 text-sm font-display uppercase tracking-tight text-left"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>{listing.merchant_name}</span>
                      </button>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#E53935]" /> {userCity}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-amber-500 font-bold flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-500" /> {listing.merchant_rating || '4.5'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-black text-[#0B1F3A] font-mono">₦{listing.price.toLocaleString()}</p>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold">per ream</p>
                    </div>
                  </div>

                  {/* Delivery details & low stock checks */}
                  <div className="flex justify-between items-center py-2.5 px-3 bg-slate-50 rounded-lg text-xs font-mono mb-4">
                    <span className="text-slate-500 flex items-center gap-1.5 font-bold">
                      <Truck className="w-3.5 h-3.5" /> Delivery Available:
                      <span className={listing.delivery === 'Yes' ? 'text-emerald-600 font-black' : 'text-slate-400 font-black'}>
                        {listing.delivery}
                      </span>
                    </span>

                    {/* LOW STOCK UX CHECK: Show quantity if low, hide if sufficient */}
                    {isLowStock ? (
                      <span className="text-[#E53935] font-black flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> Only {listing.quantity} reams left!
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold">In Stock</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleViewMerchantStore(listing.merchant_id, listing.merchant_name)}
                      className="py-2.5 px-3 border border-[#E2E8F0] hover:border-slate-300 rounded-xl text-xs font-bold text-[#0B1F3A] bg-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>View Store</span>
                    </button>
                    
                    <button
                      onClick={() => navigate(`/checkout?product=${listing.id}`)}
                      className="py-2.5 px-3 bg-[#0B1F3A] hover:bg-[#16365C] rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-[#0B1F3A]/10"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Order Materials</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ================= SCREEN 4: MERCHANT STOREFRONT ================= */}
      {selectedMerchantStore && (
        <div className="animate-fade-in max-w-md mx-auto px-4 py-6">
          {/* Back button */}
          <button 
            onClick={() => setSelectedMerchantStore(null)}
            className="flex items-center gap-2 text-xs font-bold uppercase text-[#0B1F3A] hover:text-[#00C2FF] mb-6 font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to listings</span>
          </button>

          {/* Merchant Store Header */}
          <div className="bg-[#0B1F3A] text-white rounded-2xl p-6 shadow-md mb-6 relative overflow-hidden">
            {/* Circle overlay monogram */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-12 -mt-12" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-[#00C2FF] text-2xl font-bold font-display shadow-inner mb-3">
                {selectedMerchantStore.name.slice(0, 2).toUpperCase()}
              </div>
              <h2 className="text-xl font-black font-display uppercase tracking-tight text-white">
                {selectedMerchantStore.name}
              </h2>
              <p className="text-xs text-slate-300 font-mono mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#E53935]" /> {selectedMerchantStore.location}
              </p>

              <div className="flex gap-4 mt-4 pt-4 border-t border-white/10 w-full text-center">
                <div className="flex-1">
                  <span className="block text-[10px] font-mono text-slate-400 font-bold uppercase">Average Rating</span>
                  <span className="text-sm font-bold text-amber-400 flex items-center justify-center gap-0.5 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> 4.8
                  </span>
                </div>
                <div className="w-px bg-white/10" />
                <div className="flex-1">
                  <span className="block text-[10px] font-mono text-slate-400 font-bold uppercase">Supplier Status</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> GTBank Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Store Inventory catalog title */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black font-display text-[#0B1F3A] uppercase tracking-wider">Store Inventory</h3>
            <span className="text-xs font-bold text-slate-400 font-mono">({selectedMerchantStore.inventory.length} papers listed)</span>
          </div>

          {/* Store Catalog list */}
          <div className="space-y-4">
            {selectedMerchantStore.inventory.map((stock) => {
              const isLowStock = stock.quantity && stock.quantity < 50;
              return (
                <div 
                  key={stock.id}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm hover:border-[#00C2FF] hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-base text-[#0B1F3A]">{stock.name}</h4>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{stock.gsm}gsm • {stock.size || '700×1000mm'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#0B1F3A] text-sm font-mono">₦{stock.price.toLocaleString()}</p>
                      <p className="text-[8px] uppercase tracking-wider text-slate-400 font-mono font-bold">per ream</p>
                    </div>
                  </div>

                  {/* Delivery & Quantity status tag */}
                  <div className="flex justify-between items-center py-2 px-3 bg-[#F8F8F6] rounded-lg text-xs font-mono mb-4 mt-2">
                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" /> Delivery: 
                      <span className="text-[#0B1F3A] font-bold">{stock.delivery || 'Yes'}</span>
                    </span>

                    {/* LOW STOCK UX CHECK: Show quantity if low, hide if sufficient */}
                    {isLowStock ? (
                      <span className="text-[#E53935] font-black flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" /> Only {stock.quantity} left!
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold">Available</span>
                    )}
                  </div>

                  {/* Direct Buy button */}
                  <button
                    onClick={() => navigate(`/checkout?product=${stock.id}`)}
                    className="w-full py-2.5 bg-[#0B1F3A] hover:bg-[#16365C] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-[#00C2FF]" />
                    <span>Initiate Order</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Persistence navigation */}
      <BottomNav />
    </div>
  );
};

export default BuyerMarketplace;
