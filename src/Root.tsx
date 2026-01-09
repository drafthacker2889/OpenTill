import { useState } from 'react'
import { supabase } from './supabaseClient'
import ProductGrid from './components/ProductGrid'
import CartSidebar from './components/CartSidebar'
import ReceiptModal from './components/ReceiptModal'
import './App.css'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export default function Root() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastOrder, setLastOrder] = useState<any>(null)
  
  // --- NEW: DISCOUNT STATE ---
  const [discountPercentage, setDiscountPercentage] = useState(0) // 0, 10, 20, etc.

  const addToCart = (variant: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === variant.id)
      const currentQty = existingItem ? existingItem.quantity : 0

      if (variant.track_stock && currentQty >= variant.stock_quantity) {
        alert(`Sorry, only ${variant.stock_quantity} left in stock!`)
        return prevCart
      }

      if (existingItem) {
        return prevCart.map(item => 
          item.id === variant.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      } else {
        return [...prevCart, { 
          id: variant.id, 
          name: variant.name, 
          price: variant.price, 
          quantity: 1 
        }] 
      }
    })
  }

  const removeFromCart = (variantId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === variantId)
      if (!existingItem) return prevCart

      if (existingItem.quantity === 1) {
        return prevCart.filter(item => item.id !== variantId)
      } else {
        return prevCart.map(item => 
          item.id === variantId ? { ...item, quantity: item.quantity - 1 } : item
        )
      }
    })
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty!")

    // 1. Calculate the Math
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const discountAmount = Math.round(subtotal * (discountPercentage / 100))
    const totalAmount = subtotal - discountAmount

    // 2. Prepare Payload
    const payload = {
      totalAmount: totalAmount, // We charge the Discounted Price
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    }

    // 3. Send to Database
    const { data, error } = await supabase.rpc('sell_items', { order_payload: payload })

    if (error) {
      console.error("Checkout Failed:", error)
      alert("Transaction Failed! Check console.")
    } else {
      // 4. Show Receipt
      setLastOrder({
        id: data.order_id,
        subtotal: subtotal,          // <--- Send Subtotal
        discount: discountAmount,    // <--- Send Discount Amount
        total: totalAmount,
        items: [...cart]
      })
      
      setCart([]) 
      setDiscountPercentage(0) // Reset discount after sale
      setShowReceipt(true)
    }
  }

  return (
    <div className="app-container">
      <div className="main-section">
        <ProductGrid onAddToCart={addToCart} />
      </div>

      <div className="sidebar-section">
        {/* Pass discount props to Sidebar */}
        <CartSidebar 
          cartItems={cart} 
          onCheckout={handleCheckout} 
          onRemoveFromCart={removeFromCart}
          discountPercentage={discountPercentage}
          onSetDiscount={setDiscountPercentage}
        />
      </div>

      {showReceipt && lastOrder && (
        <ReceiptModal 
          orderId={lastOrder.id}
          subtotal={lastOrder.subtotal} // <--- New Prop
          discount={lastOrder.discount} // <--- New Prop
          total={lastOrder.total}
          items={lastOrder.items}
          onClose={() => {
            setShowReceipt(false)
            window.location.reload() 
          }}
        />
      )}
    </div>
  )
}