import { CartItem } from '../Root'

interface Props {
  cartItems: CartItem[]
}

export default function CartSidebar({ cartItems }: Props) {
  // Calculate total price
  const totalCents = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2>Current Order</h2>
      
      <div style={{ flex: 1, overflowY: 'auto', marginTop: '20px' }}>
        {cartItems.length === 0 ? (
          <p style={{ color: '#888' }}>Cart is empty</p>
        ) : (
          cartItems.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
              <div>
                <strong>{item.quantity}x</strong> {item.name}
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
        <button style={{ width: '100%', padding: '15px', background: 'black', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.2rem', marginTop: '10px', cursor: 'pointer' }}>
          Pay Now
        </button>
      </div>
    </div>
  )
}