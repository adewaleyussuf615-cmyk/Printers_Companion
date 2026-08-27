import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

interface OrderState {
  merchantId: string
  merchantName: string
  productId: string
  productName: string
  quantity: number
  pricePerUnit: number
  totalAmount: number
}

export default function PlaceOrder() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as OrderState
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    // If no state, redirect back to buyer search
    if (!state) {
      navigate('/buyer')
    }
  }, [state, navigate])

  if (!state) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      alert('Please upload payment proof')
      return
    }

    setLoading(true)
    try {
      // 1. Get current user (buyer)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 2. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}_${Date.now()}.${fileExt}`
      const filePath = `payment-proofs/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // 3. Create order record
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          buyer_id: user.id,
          merchant_id: state.merchantId,
          total_amount: state.totalAmount,
          delivery_fee: 0, // You can calculate this later
          order_status: 'pending',
          payment_status: 'uploaded'
        }])
        .select()
        .single()

      if (orderError) throw orderError

      // 4. Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert([{
          order_id: order.id,
          product_id: state.productId,
          quantity: state.quantity,
          price_at_purchase: state.pricePerUnit
        }])

      if (itemError) throw itemError

      // 5. Create payment record with proof URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath)

      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          order_id: order.id,
          proof_upload_url: publicUrl,
          verification_status: 'pending'
        }])

      if (paymentError) throw paymentError

      alert('Order placed successfully! The merchant will verify your payment.')
      navigate('/buyer')
    } catch (error: any) {
      alert('Error placing order: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="place-order">
      <h1>Place Order</h1>
      <div className="order-summary">
        <h2>Order Summary</h2>
        <p><strong>Merchant:</strong> {state.merchantName}</p>
        <p><strong>Product:</strong> {state.productName}</p>
        <p><strong>Quantity:</strong> {state.quantity}</p>
        <p><strong>Price per unit:</strong> ${state.pricePerUnit.toFixed(2)}</p>
        <p><strong>Total:</strong> ${state.totalAmount.toFixed(2)}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="proof">Upload Payment Proof (screenshot, receipt, etc.)</label>
          <input
            type="file"
            id="proof"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            required
          />
        </div>

        {loading && <p>Uploading and placing order...</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Confirm Order'}
        </button>
      </form>
    </div>
  )
}
