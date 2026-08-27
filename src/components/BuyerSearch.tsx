import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

interface Merchant {
  id: string
  business_name: string
  city: string
  state: string
  delivery_enabled: boolean
}

interface Product {
  id: string
  commercial_name: string
  gsm: number
  category: string
  use_cases: string[]
}

interface InventoryItem {
  id: string
  merchant_id: string
  product_id: string
  price_per_unit: number
  quantity_available: number
  delivery_available: boolean
  merchants: Merchant
}

export default function BuyerSearch() {
  const navigate = useNavigate()
  const [states, setStates] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [commercialName, setCommercialName] = useState('')
  const [gsm, setGsm] = useState<number | ''>('')
  const [useCase, setUseCase] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [priceSummary, setPriceSummary] = useState<{
    lowest: number
    average: number
    highest: number
    count: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})

  // Load distinct states on mount
  useEffect(() => {
    fetchStates()
  }, [])

  // Load cities when state changes
  useEffect(() => {
    if (selectedState) {
      fetchCities(selectedState)
    } else {
      setCities([])
    }
  }, [selectedState])

  async function fetchStates() {
    const { data, error } = await supabase
      .from('merchants')
      .select('state')
      .order('state')
    if (error) {
      console.error('Error fetching states:', error)
      return
    }
        const uniqueStates = [...new Set(data.map((m: any) => m.state))] as string[]
    setStates(uniqueStates)
  }

  async function fetchCities(state: string) {
    const { data, error } = await supabase
      .from('merchants')
      .select('city')
      .eq('state', state)
      .order('city')
    if (error) {
      console.error('Error fetching cities:', error)
      return
    }
    const uniqueCities = [...new Set(data.map((m: any) => m.city).filter(Boolean))] as string[]
    setCities(uniqueCities)
  }

  async function searchProducts() {
    setLoading(true)
    let query = supabase.from('product_master').select('*').eq('active_status', true)
    if (commercialName) {
      query = query.ilike('commercial_name', `%${commercialName}%`)
    }
    if (gsm !== '') {
      query = query.eq('gsm', gsm)
    }
    if (useCase) {
      query = query.contains('use_cases', [useCase])
    }
    const { data, error } = await query
    if (error) {
      console.error('Error searching products:', error)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  async function selectProduct(product: Product) {
    setSelectedProduct(product)
    setQuantities({})
    // Fetch inventory for this product in selected location
    await fetchInventory(product.id)
  }

  async function fetchInventory(productId: string) {
    setLoading(true)
    let query = supabase
      .from('merchant_inventory')
      .select(`
        id,
        merchant_id,
        product_id,
        price_per_unit,
        quantity_available,
        delivery_available,
        merchants (
          id,
          business_name,
          city,
          state,
          delivery_enabled
        )
      `)
      .eq('product_id', productId)

    if (selectedState) {
      query = query.eq('merchants.state', selectedState)
    }
    if (selectedCity) {
      query = query.eq('merchants.city', selectedCity)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching inventory:', error)
      setInventory([])
    } else {
      // Transform the data to match InventoryItem interface
      const transformedInventory: InventoryItem[] = (data || [])
        .filter((item: any) => item.merchants)
        .map((item: any) => ({
          id: item.id,
          merchant_id: item.merchant_id,
          product_id: item.product_id,
          price_per_unit: item.price_per_unit,
          quantity_available: item.quantity_available,
          delivery_available: item.delivery_available,
          merchants: Array.isArray(item.merchants) ? item.merchants[0] : item.merchants
        }))
      setInventory(transformedInventory)

      // Calculate price summary
      if (transformedInventory.length > 0) {
        const prices = transformedInventory.map((i: any) => i.price_per_unit)
        const lowest = Math.min(...prices)
        const highest = Math.max(...prices)
        const average = prices.reduce((a, b) => a + b, 0) / prices.length
        setPriceSummary({
          lowest,
          average,
          highest,
          count: transformedInventory.length
        })
      } else {
        setPriceSummary(null)
      }
    }
    setLoading(false)
  }

  function handleQuantityChange(merchantId: string, value: string) {
    const num = parseInt(value, 10)
    setQuantities(prev => ({
      ...prev,
      [merchantId]: isNaN(num) ? 0 : num
    }))
  }

  const handlePlaceOrder = (merchant: any, product: any, quantity: number) => {
    navigate('/place-order', {
      state: {
        merchantId: merchant.id,
        merchantName: merchant.business_name,
        productId: product.id,
        productName: product.commercial_name,
        quantity,
        pricePerUnit: merchant.price_per_unit,
        totalAmount: quantity * merchant.price_per_unit
      }
    })
  }

  return (
    <div className="buyer-search">
      <h1>Find Paper & Board</h1>

      {/* Location filters */}
      <div className="filters">
        <div>
          <label>State *</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            required
          >
            <option value="">Select state</option>
            {states.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label>City (optional)</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            disabled={!selectedState}
          >
            <option value="">Any city</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product search */}
      <div className="product-search">
        <h2>Search Products</h2>
        <div>
          <input
            type="text"
            placeholder="Commercial name"
            value={commercialName}
            onChange={(e) => setCommercialName(e.target.value)}
          />
          <input
            type="number"
            placeholder="GSM"
            value={gsm}
            onChange={(e) => setGsm(e.target.value ? parseInt(e.target.value) : '')}
          />
          <input
            type="text"
            placeholder="Use case (e.g. printing)"
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
          />
          <button onClick={searchProducts} disabled={loading}>
            Search
          </button>
        </div>
      </div>

      {/* Product results */}
      {products.length > 0 && !selectedProduct && (
        <div className="product-list">
          <h2>Select a product</h2>
          {products.map(p => (
            <div
              key={p.id}
              className="product-card"
              onClick={() => selectProduct(p)}
            >
              <h3>{p.commercial_name}</h3>
              <p>GSM: {p.gsm}</p>
              <p>Category: {p.category}</p>
              {p.use_cases && <p>Uses: {p.use_cases.join(', ')}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Selected product and inventory */}
      {selectedProduct && (
        <div className="selected-product">
          <h2>{selectedProduct.commercial_name}</h2>
          <button onClick={() => setSelectedProduct(null)}>Change product</button>

          {priceSummary && (
            <div className="price-summary">
              <h3>Price Summary</h3>
              <p>Lowest: ${priceSummary.lowest.toFixed(2)}</p>
              <p>Average: ${priceSummary.average.toFixed(2)}</p>
              <p>Highest: ${priceSummary.highest.toFixed(2)}</p>
              <p>Available from {priceSummary.count} merchants</p>
            </div>
          )}

          <div className="merchant-list">
            <h3>Available Merchants</h3>
            {inventory.length === 0 && <p>No merchants found in selected location.</p>}
            {inventory.map(item => (
              <div key={item.id} className="merchant-card">
                <h4>{item.merchants.business_name}</h4>
                <p>City: {item.merchants.city}</p>
                <p>Price per unit: ${item.price_per_unit}</p>
                <p>Delivery: {item.delivery_available ? 'Available' : 'Not available'}</p>
                <div>
                  <label>Quantity:</label>
                  <input
                    type="number"
                    min="0"
                    value={quantities[item.merchant_id] || 0}
                    onChange={(e) => handleQuantityChange(item.merchant_id, e.target.value)}
                  />
                  {quantities[item.merchant_id] > item.quantity_available && (
                    <span className="warning">Only {item.quantity_available} available</span>
                  )}
                  {quantities[item.merchant_id] > 0 && quantities[item.merchant_id] <= item.quantity_available && (
                    <span className="ok">Available</span>
                  )}
                </div>
                {quantities[item.merchant_id] > 0 && quantities[item.merchant_id] <= item.quantity_available && (
                  <button onClick={() => handlePlaceOrder(item.merchants, selectedProduct, quantities[item.merchant_id])}>
                    Place Order
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
