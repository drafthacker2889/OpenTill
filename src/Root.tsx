import { useState } from 'react'
import { supabase } from './supabaseClient'
import ProductGrid from './components/ProductGrid'
import CartSidebar from './components/CartSidebar'
import ReceiptModal from './components/ReceiptModal'
import PaymentModal from './components/PaymentModal' // <--- IMPORT THIS
import './App.css'

export interface CartItem {
  id: string, name: string, price: number, quantity: number
}

export default function Root() {
  const [cart, setCart] = useState<CartItem[]>([])
  
  // MODAL STATES
  const [showPayment, setShowPayment] = useState(false) // Shows the Cash/Card options
  const [showReceipt, setShowReceipt] = useState(false) // Shows the Bill
  
  const [lastOrder, setLastOrder] = useState<any>(null)
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  // 1. ADD TO CART
  const addToCart = (variant: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === variant.id)
      const currentQty = existingItem ? existingItem.quantity : 0

      if (variant.track_stock && currentQty >= variant.stock_quantity) {
        alert(`Sorry, only ${variant.stock_quantity} left in stock!`)
        return prevCart
      }

      if (existingItem) {
        return prevCart.map(item => item.id === variant.id ? { ...item, quantity: item.quantity + 1 } : item)
      } else {
        return [...prevCart, { id: variant.id, name: variant.name, price: variant.price, quantity: 1 }]
      }
    })
  }

  // 2. REMOVE FROM CART
  const removeFromCart = (variantId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === variantId)
      if (!existingItem) return prevCart
      if (existingItem.quantity === 1) return prevCart.filter(item => item.id !== variantId)
      return prevCart.map(item => item.id === variantId ? { ...item, quantity: item.quantity - 1 } : item)
    })
  }

  // 3. START CHECKOUT (Just opens the modal)
  const handleInitiateCheckout = () => {
    if (cart.length === 0) return alert("Cart is empty!")
    setShowPayment(true) // <--- Safety Gate Opens Here
  }

  // 4. CONFIRM PAYMENT (The Real Transaction)
  const handleConfirmPayment = async (method: 'CASH' | 'CARD') => {
    setShowPayment(false) // Close the payment modal
    
    // Calculate Math
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const discountAmount = Math.round(subtotal * (discountPercentage / 100))
    const totalAmount = subtotal - discountAmount

    // Prepare Payload (Now includes PAYMENT METHOD)
    const payload = {
      totalAmount: totalAmount,
      paymentMethod: method, // <--- Sending "CASH" or "CARD"
      items: cart.map(item => ({
        id: item.id, name: item.name, price: item.price, quantity: item.quantity
      }))
    }

    // Call Database
    const { data, error } = await supabase.rpc('sell_items', { order_payload: payload })

    if (error) {
      console.error("Checkout Failed:", error)
      alert("Transaction Failed! Check console.")
    } else {
      // Success Logic
      setLastOrder({
        id: data.order_id,
        subtotal: subtotal,
        discount: discountAmount,
        total: totalAmount,
        items: [...cart],
        method: method // Save method for receipt if needed
      })
      
      setCart([]) 
      setDiscountPercentage(0)
      setShowReceipt(true) // Show the Bill
    }
  }

  return (
    <div className="app-container">
      <div className="main-section">
        <ProductGrid key={refreshKey} onAddToCart={addToCart} />
      </div>

      <div className="sidebar-section">
        <CartSidebar 
          cartItems={cart} 
          onCheckout={handleInitiateCheckout} // <--- Calls the Safety Gate
          onRemoveFromCart={removeFromCart}
          discountPercentage={discountPercentage}
          onSetDiscount={setDiscountPercentage}
        />
      </div>

      {/* PAYMENT MODAL (The Safety Gate) */}
      {showPayment && (
        <PaymentModal 
          total={cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * (1 - discountPercentage/100)}
          onConfirm={handleConfirmPayment}
          onCancel={() => setShowPayment(false)}
        />
      )}

      {/* RECEIPT MODAL (The Bill) */}
      {showReceipt && lastOrder && (
        <ReceiptModal 
          orderId={lastOrder.id}
          subtotal={lastOrder.subtotal}
          discount={lastOrder.discount}
          total={lastOrder.total}
          paymentMethod={lastOrder.method}
          items={lastOrder.items}
          onClose={() => {
            setShowReceipt(false)
            setRefreshKey(prev => prev + 1)
          }}
        />
      )}
    </div>
  )
}