import { useState } from 'react';
import { supabase } from './supabaseClient';
import ProductGrid from './components/ProductGrid';
import CartSidebar from './components/CartSidebar';
import ReceiptModal from './components/ReceiptModal';
import PaymentModal from './components/PaymentModal';
import './App.css';

// Type definition for items in the cart
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function Root() {
  // --- State Management ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // --- 1. Add to Cart Logic ---
  const addToCart = (variant: any) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === variant.id);
      const currentQty = existingItem ? existingItem.quantity : 0;

      // Check stock if tracking is enabled
      if (variant.track_stock && currentQty >= variant.stock_quantity) {
        alert(`Sorry, only ${variant.stock_quantity} left in stock!`);
        return prevCart;
      }

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === variant.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [
          ...prevCart,
          { id: variant.id, name: variant.name, price: variant.price, quantity: 1 },
        ];
      }
    });
  };

  // --- 2. Remove from Cart Logic ---
  const removeFromCart = (variantId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === variantId);
      if (!existingItem) return prevCart;

      if (existingItem.quantity === 1) {
        return prevCart.filter((item) => item.id !== variantId);
      }
      return prevCart.map((item) =>
        item.id === variantId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  // --- 3. Checkout Initiation ---
  const handleInitiateCheckout = () => {
    if (cart.length === 0) return alert("Cart is empty!");
    setShowPayment(true);
  };

  // --- 4. Confirm Payment & Database Sync ---
  const handleConfirmPayment = async (method: 'CASH' | 'CARD', tipAmount: number) => {
    setShowPayment(false);

    // Financial Calculations
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = Math.round(subtotal * (discountPercentage / 100));
    const totalAmount = subtotal - discountAmount + tipAmount;

    // Supabase Payload
    const payload = {
      totalAmount: totalAmount,
      paymentMethod: method,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    };

    // Call Database RPC
    const { data, error } = await supabase.rpc('sell_items', { order_payload: payload });

    if (error) {
      console.error("Checkout Failed:", error);
      alert("Transaction Failed! Check console for details.");
    } else {
      // Save order details for the receipt
      setLastOrder({
        id: data.order_id,
        subtotal: subtotal,
        discount: discountAmount,
        tip: tipAmount,
        total: totalAmount,
        items: [...cart],
        method: method,
      });

      // Reset application state
      setCart([]);
      setDiscountPercentage(0);
      setShowReceipt(true);
    }
  };

  return (
    <div className="content-wrapper">
      <div className="main-section">
        {/* The refreshKey forces the grid to re-fetch stock after a sale */}
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

      {/* PAYMENT MODAL */}
      {showPayment && (
        <PaymentModal
          subtotal={
            cart.reduce((sum, item) => sum + item.price * item.quantity, 0) *
            (1 - discountPercentage / 100)
          }
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
          tip={lastOrder.tip}
          total={lastOrder.total}
          paymentMethod={lastOrder.method}
          items={lastOrder.items}
          onClose={() => {
            setShowReceipt(false);
            // Trigger refresh to update stock counts in ProductGrid
            setRefreshKey((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}