import { useState } from 'react'
import { supabase } from './supabaseClient'
import ProductGrid from './components/ProductGrid'
import CartSidebar from './components/CartSidebar'
import ReceiptModal from './components/ReceiptModal' // <--- New Import
import './App.css'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export default function Root() {
  const [cart, setCart] = useState<CartItem[]>([])
  
  // New state for the Receipt Modal
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastOrder, setLastOrder] = useState<any>(null)

  // 1. ADD: Logic to add items (With Stock Safety Checks)
  const addToCart = (variant: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === variant.id)
      const currentQty = existingItem ? existingItem.quantity : 0

      // SAFETY CHECK: If tracking is ON, stop if we hit the limit
      if (variant.track_stock && currentQty >= variant.stock_quantity) {
        alert(`Sorry, only ${variant.stock_quantity} left in stock!`)
        return prevCart // Return the cart unchanged
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

  // 2. REMOVE: Logic to remove items
  const removeFromCart = (variantId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === variantId)
      
      if (!existingItem) return prevCart

      if (existingItem.quantity === 1) {
        return prevCart.filter(item => item.id !== variantId)
      } else {
        return prevCart.map(item => 
          item.id === variantId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
        )
      }
    })
  }

  // 3. CHECKOUT: Connects to Database & Shows Receipt
  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty!")

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const payload = {
      totalAmount: totalAmount,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    }

    // Call the database function
    const { data, error } = await supabase.rpc('sell_items', { order_payload: payload })

    if (error) {
      console.error("Checkout Failed:", error)
      alert("Transaction Failed! Check console for details.")
    } else {
      // SUCCESS! 
      // 1. Save order details so we can show the receipt
      setLastOrder({
        id: data.order_id, 
        total: totalAmount,
        items: [...cart]   // Save a copy of the cart items
      })
      
      // 2. Clear the active cart
      setCart([]) 

      // 3. Show the Receipt Modal
      setShowReceipt(true)
    }
  }

  return (
    <div className="app-container">
      <div className="main-section">
        <ProductGrid onAddToCart={addToCart} />
      </div>

      <div className="sidebar-section">
        <CartSidebar 
          cartItems={cart} 
          onCheckout={handleCheckout} 
          onRemoveFromCart={removeFromCart} 
        />
      </div>

      {/* NEW: RECEIPT MODAL COMPONENT */}
      {showReceipt && lastOrder && (
        <ReceiptModal 
          orderId={lastOrder.id}
          total={lastOrder.total}
          items={lastOrder.items}
          onClose={() => {
            setShowReceipt(false)
            // Optional: Reload to fetch updated stock numbers
            window.location.reload() 
          }}
        />
      )}
    </div>
  )
}