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

  // 1. ADD: Logic to add items (Existing)
  const addToCart = (variant: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === variant.id)
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

  // 2. NEW: Logic to remove items
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

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty!")

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        total_amount: totalAmount,
        status: 'COMPLETED',
        payment_method: 'CASH',
        device_id: 'POS-01'
      })
      .select()
      .single()

    if (orderError) {
      console.error("Order Failed:", orderError)
      return alert("Transaction Failed!")
    }

    const orderItems = cart.map(item => ({
      order_id: orderData.id,
      product_name_snapshot: item.name,
      price_at_sale: item.price,
      quantity: item.quantity
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

    if (itemsError) {
      console.error("Items Failed:", itemsError)
    } else {
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
        {/* 3. Pass the new function down to Sidebar */}
        <CartSidebar 
          cartItems={cart} 
          onCheckout={handleCheckout} 
          onRemoveFromCart={removeFromCart} 
        />
      </div>
    </div>
  )
}