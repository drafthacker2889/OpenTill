import { useState } from 'react'
import { supabase } from './supabaseClient' // <--- IMPORT SUPABASE
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

    const addToCart = (variant: any) => {
    setCart(prevCart => {
      // Check if this specific VARIANT is already in the cart
      const existingItem = prevCart.find(item => item.id === variant.id)
      
      if (existingItem) {
        return prevCart.map(item => 
          item.id === variant.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        )
      } else {
        return [...prevCart, { 
          id: variant.id, 
          name: variant.name, 
          price: variant.price, // <--- Using the REAL price from DB
          quantity: 1 
        }] 
      }
    })
  }

  // --- NEW CHECKOUT LOGIC ---
  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty!")

    // 1. Calculate Total
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // 2. Create the "Order" Record
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        total_amount: totalAmount,
        status: 'COMPLETED',
        payment_method: 'CASH', // Hardcoded for now
        device_id: 'POS-01'
      })
      .select()
      .single()

    if (orderError) {
      console.error("Order Failed:", orderError)
      return alert("Transaction Failed!")
    }

    // 3. Create the "Order Items" (The receipt lines)
    const orderItems = cart.map(item => ({
      order_id: orderData.id,
      product_name_snapshot: item.name,
      price_at_sale: item.price,
      quantity: item.quantity
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error("Items Failed:", itemsError)
    } else {
      // 4. Success! Clear the cart
      alert("✅ Payment Successful! Order #" + orderData.id.slice(0, 4))
      setCart([]) 
    }
  }

  return (
    <div className="app-container">
      <div className="main-section">
        <ProductGrid onAddToCart={addToCart} />
      </div>

      <div className="sidebar-section">
        {/* Pass the checkout function to the sidebar */}
        <CartSidebar cartItems={cart} onCheckout={handleCheckout} />
      </div>
    </div>
  )
}