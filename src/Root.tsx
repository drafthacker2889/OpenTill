import { useState } from 'react'
import ProductGrid from './components/ProductGrid'
import CartSidebar from './components/CartSidebar'
import './App.css'

// 1. Define what a "Cart Item" looks like
export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export default function Root() {
  const [cart, setCart] = useState<CartItem[]>([])

  // 2. The Logic: Add item or increase quantity
  const addToCart = (product: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      
      if (existingItem) {
        // If it's already there, just add +1 to quantity
        return prevCart.map(item => 
          item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        )
      } else {
        // If it's new, add it to the list
        // (We are hardcoding price as $10.00 for now until we connect the Variants table)
        return [...prevCart, { 
          id: product.id, 
          name: product.name, 
          price: 1000, // $10.00 in cents
          quantity: 1 
        }] 
      }
    })
  }

  return (
    <div className="app-container">
      {/* Pass the "addToCart" function down to the grid */}
      <div className="main-section">
        <ProductGrid onAddToCart={addToCart} />
      </div>

      {/* Pass the "cart" data down to the sidebar */}
      <div className="sidebar-section">
        <CartSidebar cartItems={cart} />
      </div>
    </div>
  )
}