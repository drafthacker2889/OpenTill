import { CartItem } from '../Root'

interface Props {
  cartItems: CartItem[]
  onCheckout: () => void
  onRemoveFromCart: (id: string) => void // <--- Accept the new function
}

export default function CartSidebar({ cartItems, onCheckout, onRemoveFromCart }: Props) {
  const totalCents = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

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
                {/* RED REMOVE BUTTON */}
                <button 
                  onClick={() => onRemoveFromCart(item.id)}
                  style={{
                    background: '#ff4d4d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  -
                </button>

                <div>
                  <strong>{item.quantity}x</strong> {item.name}
                </div>
              </div>

              <div>
                ${((item.price * item.quantity) / 100).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ borderTop: '2px solid #333', paddingTop: '20px', marginTop: 'auto' }}>
        <h1>Total: ${(totalCents / 100).toFixed(2)}</h1>
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