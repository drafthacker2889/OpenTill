import { useState } from 'react'
import { supabase } from './supabaseClient'
import ProductGrid from './components/ProductGrid'
import CartSidebar from './components/CartSidebar'
import ReceiptModal from './components/ReceiptModal'
import PaymentModal from './components/PaymentModal' 
import './App.css'

export interface CartItem {
  id: string, name: string, price: number, quantity: number
}

export default function Root() {
  const [cart, setCart] = useState<CartItem[]>([])
  
  // States
  const [showPayment, setShowPayment] = useState(false) 
  const [showReceipt, setShowReceipt] = useState(false) 
  
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

  // 3. START CHECKOUT
  const handleInitiateCheckout = () => {
    if (cart.length === 0) return alert("Cart is empty!")
    setShowPayment(true) 
  }

  // 4. CONFIRM PAYMENT (With Tip!)
  const handleConfirmPayment = async (method: 'CASH' | 'CARD', tipAmount: number) => {
    setShowPayment(false) 
    
    // Calculate Math
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const discountAmount = Math.round(subtotal * (discountPercentage / 100))
    const totalAmount = (subtotal - discountAmount) + tipAmount // Final Charge

    // Payload
    const payload = {
      totalAmount: totalAmount,
      paymentMethod: method, 
      items: cart.map(item => ({
        id: item.id, name: item.name, price: item.price, quantity: item.quantity
      }))
    }

    const { data, error } = await supabase.rpc('sell_items', { order_payload: payload })

    if (error) {
      console.error("Checkout Failed:", error)
      alert("Transaction Failed! Check console.")
    } else {
      setLastOrder({
        id: data.order_id,
        subtotal: subtotal,
        discount: discountAmount,
        tip: tipAmount,    // <--- SAVE TIP FOR RECEIPT
        total: totalAmount,
        items: [...cart],
        method: method 
      })
      
      setCart([]) 
      setDiscountPercentage(0)
      setShowReceipt(true) 
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
          onCheckout={handleInitiateCheckout}
          onRemoveFromCart={removeFromCart}
          discountPercentage={discountPercentage}
          onSetDiscount={setDiscountPercentage}
        />
      </div>

      {/* PAYMENT MODAL (Pass subtotal so it can calculate 10% tip) */}
      {showPayment && (
        <PaymentModal 
          subtotal={cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * (1 - discountPercentage/100)}
          onConfirm={handleConfirmPayment}
          onCancel={() => setShowPayment(false)}
        />
      )}

      {/* RECEIPT MODAL */}
      {showReceipt && lastOrder && (
        <ReceiptModal 
          orderId={lastOrder.id}
          subtotal={lastOrder.subtotal}
          discount={lastOrder.discount}
          tip={lastOrder.tip} // <--- Pass tip to receipt
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