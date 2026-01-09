import { useState } from 'react'
import { supabase } from './supabaseClient'
import ProductGrid from './components/ProductGrid'
import CartSidebar from './components/CartSidebar'
import './App.css'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export default function Root() {
  const [cart, setCart] = useState<CartItem[]>([])

  // 1. ADD: Logic to add items (Now with Safety Checks)
  const addToCart = (variant: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === variant.id)
      const currentQty = existingItem ? existingItem.quantity : 0

      // --- NEW SAFETY CHECK ---
      // If tracking is ON, and we are about to exceed the limit... STOP.
      if (variant.track_stock && currentQty >= variant.stock_quantity) {
        alert(`Sorry, only ${variant.stock_quantity} left in stock!`)
        return prevCart // Return the cart unchanged
      }
      // ------------------------

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
      
      // If it doesn't exist, do nothing
      if (!existingItem) return prevCart

      // If quantity is 1, remove it completely
      if (existingItem.quantity === 1) {
        return prevCart.filter(item => item.id !== variantId)
      } 
      // If quantity > 1, just decrease the count
      else {
        return prevCart.map(item => 
          item.id === variantId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
        )
      }
    })
  }

  // 3. CHECKOUT: New RPC (Server-side) Logic
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

    // --- DEBUG LOGGING ---
    console.log("SENDING PAYLOAD TO DB:", payload); 
    // ---------------------

    const { data, error } = await supabase.rpc('sell_items', { order_payload: payload })

    // ... rest of your code
    if (error) {
      console.error("Checkout Failed:", error)
      alert("Transaction Failed! Check console for details.")
    } else {
      // Success!
      alert("✅ Payment Successful!")
      setCart([]) 
      
      // Reload the page to fetch updated stock numbers from the DB
      window.location.reload()
    }
  }

  return (
    <div className="app-container">
      <div className="main-section">
        {/* Pass the add function to the Grid */}
        <ProductGrid onAddToCart={addToCart} />
      </div>

      <div className="sidebar-section">
        {/* Pass cart data and handlers to the Sidebar */}
        <CartSidebar 
          cartItems={cart} 
          onCheckout={handleCheckout} 
          onRemoveFromCart={removeFromCart} 
        />
      </div>
    </div>
  )
}