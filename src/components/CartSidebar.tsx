import { CartItem } from '../Root'

interface Props {
  cartItems: CartItem[]
  onCheckout: () => void
  onRemoveFromCart: (id: string) => void
  discountPercentage: number          // <--- NEW
  onSetDiscount: (val: number) => void // <--- NEW
}

export default function CartSidebar({ cartItems, onCheckout, onRemoveFromCart, discountPercentage, onSetDiscount }: Props) {
  
  // Calculate Math
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = Math.round(subtotal * (discountPercentage / 100))
  const finalTotal = subtotal - discountAmount

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2>Current Order</h2>
      
      <div style={{ flex: 1, overflowY: 'auto', marginTop: '20px' }}>
        {cartItems.length === 0 ? (
          <p style={{ color: '#888' }}>Cart is empty</p>
        ) : (
          cartItems.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                  onClick={() => onRemoveFromCart(item.id)}
                  style={{ background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                >
                  -
                </button>
                <div><strong>{item.quantity}x</strong> {item.name}</div>
              </div>
              <div>${((item.price * item.quantity) / 100).toFixed(2)}</div>
            </div>
          ))
        )}
      </div>

      <div style={{ borderTop: '2px solid #333', paddingTop: '20px', marginTop: 'auto' }}>
        
        {/* --- DISCOUNT BUTTONS --- */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
          <button onClick={() => onSetDiscount(0)} style={{ flex: 1, padding: '8px', cursor: 'pointer', background: discountPercentage === 0 ? '#333' : '#eee', color: discountPercentage === 0 ? 'white' : 'black', border: 'none', borderRadius: '4px' }}>None</button>
          <button onClick={() => onSetDiscount(10)} style={{ flex: 1, padding: '8px', cursor: 'pointer', background: discountPercentage === 10 ? '#333' : '#eee', color: discountPercentage === 10 ? 'white' : 'black', border: 'none', borderRadius: '4px' }}>10%</button>
          <button onClick={() => onSetDiscount(20)} style={{ flex: 1, padding: '8px', cursor: 'pointer', background: discountPercentage === 20 ? '#333' : '#eee', color: discountPercentage === 20 ? 'white' : 'black', border: 'none', borderRadius: '4px' }}>20%</button>
          <button onClick={() => onSetDiscount(50)} style={{ flex: 1, padding: '8px', cursor: 'pointer', background: discountPercentage === 50 ? '#333' : '#eee', color: discountPercentage === 50 ? 'white' : 'black', border: 'none', borderRadius: '4px' }}>50%</button>
        </div>

        {/* --- TOTALS DISPLAY --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>
          <span>Subtotal:</span>
          <span>${(subtotal / 100).toFixed(2)}</span>
        </div>
        
        {discountPercentage > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'red', marginBottom: '10px' }}>
            <span>Discount ({discountPercentage}%):</span>
            <span>-${(discountAmount / 100).toFixed(2)}</span>
          </div>
        )}

        <h1 style={{ marginTop: '0' }}>Total: ${(finalTotal / 100).toFixed(2)}</h1>
        
        <button 
          onClick={onCheckout}
          style={{ width: '100%', padding: '15px', background: 'black', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.2rem', marginTop: '10px', cursor: 'pointer' }}
        >
          Pay Now
        </button>
      </div>
    </div>
  )
}