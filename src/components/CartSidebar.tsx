import { CartItem } from '../Root'

interface Props {
  cartItems: CartItem[]
  onCheckout: () => void
  onRemoveFromCart: (id: string) => void
  discountPercentage: number
  onSetDiscount: (val: number) => void
}

export default function CartSidebar({ 
  cartItems, 
  onCheckout, 
  onRemoveFromCart, 
  discountPercentage, 
  onSetDiscount 
}: Props) {
  
  // Calculate Math
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = Math.round(subtotal * (discountPercentage / 100))
  const finalTotal = subtotal - discountAmount

  return (
    <div className="sidebar-section">
      {/* --- HEADER (Fixed) --- */}
      <div className="sidebar-header">
        <h2 style={{ marginTop: 0, fontSize: '1.5rem' }}>Current Order</h2>
      </div>
      
      {/* --- CART ITEMS LIST (Scrollable Middle Container) --- */}
      <div className="order-items-container">
        {cartItems.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic', marginTop: '20px' }}>
            No items added yet.
          </p>
        ) : (
          cartItems.map(item => (
            <div 
              key={item.id} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '12px', 
                paddingBottom: '12px', 
                borderBottom: '1px solid #f0f0f0' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={() => onRemoveFromCart(item.id)}
                  style={{ 
                    background: '#eda8b2', 
                    color: '#fb1919', 
                    border: 'none', 
                    borderRadius: '6px', 
                    width: '28px', 
                    height: '28px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  -
                </button>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#888' }}>x{item.quantity}</div>
                </div>
              </div>
              <div style={{ fontWeight: '600' }}>
                ${((item.price * item.quantity) / 100).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- BOTTOM SECTION (Fixed at bottom) --- */}
      <div className="order-summary-footer">
        
        {/* Discount Toggles */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ 
            fontSize: '0.8rem', 
            fontWeight: 'bold', 
            color: '#aaa', 
            textTransform: 'uppercase', 
            marginBottom: '8px' 
          }}>
            Discount
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[0, 10, 20, 50].map(pct => (
              <button 
                key={pct}
                onClick={() => onSetDiscount(pct)} 
                style={{ 
                  padding: '8px', 
                  cursor: 'pointer', 
                  background: discountPercentage === pct ? 'black' : 'white', 
                  color: discountPercentage === pct ? 'white' : '#333', 
                  border: discountPercentage === pct ? '1px solid black' : '1px solid #ddd', 
                  borderRadius: '6px', 
                  fontSize: '0.9rem', 
                  fontWeight: '600', 
                  transition: '0.2s'
                }}
              >
                {pct === 0 ? 'None' : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Math Summary */}
        <div style={{ marginBottom: '20px', fontSize: '0.95rem', color: '#666' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>Subtotal</span>
            <span>${(subtotal / 100).toFixed(2)}</span>
          </div>
          {discountPercentage > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e53935' }}>
              <span>Discount ({discountPercentage}%)</span>
              <span>-${(discountAmount / 100).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Split Footer Layout */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px', 
          borderTop: '2px solid #f0f0f0', 
          paddingTop: '20px' 
        }}>
          
          {/* Left: Total Amount */}
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: '0.85rem', 
              color: '#999', 
              textTransform: 'uppercase', 
              fontWeight: 'bold' 
            }}>
              Total
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: '1' }}>
              ${(finalTotal / 100).toFixed(2)}
            </div>
          </div>

          {/* Right: Pay Button */}
          <button 
            onClick={onCheckout}
            disabled={cartItems.length === 0}
            className="pay-now-button"
            style={{ 
              flex: 1.5, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '8px' 
            }}
          >
            Pay Now ➔
          </button>
        </div>
      </div>
    </div>
  )
}