import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ProductGrid from './components/ProductGrid';
import CartSidebar from './components/CartSidebar';
import ReceiptModal from './components/ReceiptModal';
import PaymentModal from './components/PaymentModal';
import TableSelection from './components/TableSelection'; 
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

  // --- Table Management States ---
  const [diningModeActive, setDiningModeActive] = useState(false); 
  const [selectedTable, setSelectedTable] = useState<string | null>(null); 

  // --- NEW: Notification State ---
  const [notification, setNotification] = useState<string | null>(null);

  // --- 1. Load Settings and Persistent Cart ---
  useEffect(() => {
    fetchDiningMode();
  }, []);

  // --- NEW: Notification Listener ---
  useEffect(() => {
    const channel = supabase
      .channel('till_notifications')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'kitchen_tickets' },
        (payload) => {
          if (payload.new.status === 'COMPLETED') {
            setNotification(`✅ Order for ${payload.new.table_number} is READY!`);
            setTimeout(() => setNotification(null), 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Every time a table is selected, load its specific saved items from DB
  useEffect(() => {
    if (selectedTable) {
      loadTableCart();
    } else {
      setCart([]); // Clear local view when on floor plan
    }
  }, [selectedTable]);

  const fetchDiningMode = async () => {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'dining_mode')
      .single(); 
    
    if (data) setDiningModeActive(data.value);
  };

  const loadTableCart = async () => {
    if (!selectedTable) return;
    const { data } = await supabase
      .from('table_cart_items')
      .select('*')
      .eq('table_number', selectedTable);
    
    if (data) {
      setCart(data.map(item => ({
        id: item.variant_id,
        name: item.product_name,
        price: item.price_at_addition,
        quantity: item.quantity,
        status: item.status //
      })));
    }
  };

  // --- 2. Add to Cart Logic (Saves to Database) ---
  const addToCart = async (variant: any) => {
    // If Dining Mode is active, items MUST be linked to a table
    if (diningModeActive && !selectedTable) return;

    if (variant.track_stock) {
      const existingInCart = cart.find(i => i.id === variant.id);
      const currentQty = existingInCart ? existingInCart.quantity : 0;
      if (currentQty >= variant.stock_quantity) {
        return alert(`Sorry, only ${variant.stock_quantity} left in stock!`);
      }
    }

    if (diningModeActive && selectedTable) {
      // PERSISTENT DB LOGIC: Check if item exists for this table and is still in DRAFT status
      const { data: existing } = await supabase
        .from('table_cart_items')
        .select('*')
        .eq('table_number', selectedTable)
        .eq('variant_id', variant.id)
        .eq('status', 'DRAFT') // Only update quantity if it hasn't been sent to kitchen yet
        .single();

      if (existing) {
        await supabase.from('table_cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
      } else {
        await supabase.from('table_cart_items').insert({
          table_number: selectedTable,
          variant_id: variant.id,
          product_name: variant.name,
          price_at_addition: variant.price,
          quantity: 1,
          status: 'DRAFT' // Initial status is DRAFT
        });
        
        // Update table status to OCCUPIED when the first item is added
        await supabase.from('dining_tables').update({ status: 'OCCUPIED' }).eq('table_number', selectedTable);
      }
      loadTableCart(); // Sync UI with DB
    } else {
      // Fallback for Quick Service (Local State only)
      setCart((prevCart) => {
        const existingItem = prevCart.find((item) => item.id === variant.id);
        if (existingItem) {
          return prevCart.map((item) => item.id === variant.id ? { ...item, quantity: item.quantity + 1 } : item);
        } else {
          return [...prevCart, { id: variant.id, name: variant.name, price: variant.price, quantity: 1 }];
        }
      });
    }
  };

  // --- 3. Remove from Cart Logic (Syncs with DB) ---
  const removeFromCart = async (variantId: string) => {
    if (diningModeActive && selectedTable) {
      // Fetch the most recent addition for this variant at this table
      const { data: existing } = await supabase
        .from('table_cart_items')
        .select('*')
        .eq('table_number', selectedTable)
        .eq('variant_id', variantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        // Handle Voids for items already sent to kitchen
        if (existing.status === 'SENT') {
          if (!confirm("This item was already sent to the kitchen. Void it?")) return;
          
          await supabase.from('kitchen_tickets').insert({
            table_number: selectedTable,
            items: [{ name: existing.product_name, qty: existing.quantity, void: true }],
            status: 'VOIDED'
          });
        }

        if (existing.quantity <= 1) {
          await supabase.from('table_cart_items').delete().eq('id', existing.id);
          
          // Check if table is now empty to revert status to AVAILABLE
          const { data: remaining } = await supabase.from('table_cart_items').select('id').eq('table_number', selectedTable);
          if (!remaining || remaining.length === 0) {
             await supabase.from('dining_tables').update({ status: 'AVAILABLE' }).eq('table_number', selectedTable);
          }
        } else {
          await supabase.from('table_cart_items').update({ quantity: existing.quantity - 1 }).eq('id', existing.id);
        }
      }
      loadTableCart();
    } else {
      setCart((prevCart) => {
        const existingItem = prevCart.find((item) => item.id === variantId);
        if (!existingItem) return prevCart;
        if (existingItem.quantity === 1) return prevCart.filter((item) => item.id !== variantId);
        return prevCart.map((item) => item.id === variantId ? { ...item, quantity: item.quantity - 1 } : item);
      });
    }
  };

  // --- NEW: Kitchen Routing Logic ---
  const handleSendToKitchen = async () => {
    if (!selectedTable) return;

    // 1. Fetch only items marked as DRAFT
    const { data: draftItems } = await supabase
      .from('table_cart_items')
      .select('*')
      .eq('table_number', selectedTable)
      .eq('status', 'DRAFT');

    if (!draftItems || draftItems.length === 0) return alert("No new items to send.");

    // 2. Create the Kitchen Ticket record
    const { error: ticketError } = await supabase.from('kitchen_tickets').insert({
      table_number: selectedTable,
      items: draftItems.map(i => ({ name: i.product_name, qty: i.quantity })),
      status: 'PENDING'
    });

    if (ticketError) return alert("Kitchen Routing Failed: " + ticketError.message);

    // 3. Update those items to SENT status so they aren't sent again
    await supabase
      .from('table_cart_items')
      .update({ status: 'SENT' })
      .eq('table_number', selectedTable)
      .eq('status', 'DRAFT');

    loadTableCart();
    alert("Order fired to kitchen!");
  };

  // --- 4. Checkout Initiation ---
  const handleInitiateCheckout = () => {
    if (cart.length === 0) return alert("Cart is empty!");
    setShowPayment(true);
  };

  // --- 5. Confirm Payment & Clear Table Persistence ---
  const handleConfirmPayment = async (method: 'CASH' | 'CARD', tipAmount: number) => {
    setShowPayment(false);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = Math.round(subtotal * (discountPercentage / 100));
    const totalAmount = subtotal - discountAmount + tipAmount;

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

    const { data, error } = await supabase.rpc('sell_items', { order_payload: payload });

    if (error) {
      alert("Transaction Failed!");
    } else {
      // IF DINING MODE: Clear the saved items and reset table status to AVAILABLE
      if (selectedTable) {
        await supabase.from('table_cart_items').delete().eq('table_number', selectedTable);
        await supabase.from('dining_tables').update({ status: 'AVAILABLE' }).eq('table_number', selectedTable);
      }

      setLastOrder({
        id: data.order_id,
        subtotal: subtotal,
        discount: discountAmount,
        tip: tipAmount,
        total: totalAmount,
        items: [...cart],
        method: method,
      });

      setCart([]);
      setDiscountPercentage(0);
      setSelectedTable(null); 
      setShowReceipt(true);
    }
  };

  // --- Conditional Rendering for Dining Mode ---
  if (diningModeActive && !selectedTable) {
    return <TableSelection onSelect={(table) => setSelectedTable(table)} />;
  }

  return (
    <div className="content-wrapper">
      <div className="main-section">
        {/* Table Serving Header - Now supports switching without data loss */}
        {selectedTable && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px', 
            padding: '15px', 
            background: '#fff', 
            borderRadius: '8px', 
            border: '1px solid #ddd' 
          }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>📍 Serving: {selectedTable}</span>
            <button 
              onClick={() => setSelectedTable(null)} 
              style={{ padding: '8px 15px', background: '#eee', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Switch Table
            </button>
          </div>
        )}

        <ProductGrid key={refreshKey} onAddToCart={addToCart} />
      </div>

      <div className="sidebar-section">
        <CartSidebar
          cartItems={cart}
          onCheckout={handleInitiateCheckout}
          onRemoveFromCart={removeFromCart}
          discountPercentage={discountPercentage}
          onSetDiscount={setDiscountPercentage}
          onSendToKitchen={handleSendToKitchen} //
        />
      </div>

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

      {/* --- NEW: Order Ready Notification Popup --- */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#2e7d32',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 'bold',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <span>{notification}</span>
          <button 
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}