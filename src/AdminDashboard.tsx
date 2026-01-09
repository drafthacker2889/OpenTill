import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('inventory')
  const [variants, setVariants] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'inventory') fetchVariants()
    else fetchOrders()
  }, [activeTab])

  // --- INVENTORY LOGIC (Same as before) ---
  const fetchVariants = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('variants')
      .select('*, products(name)')
      .order('product_id')
    
    if (error) console.error('Error fetching inventory:', error)
    else setVariants(data || [])
    setLoading(false)
  }

  const toggleStockTracking = async (id: string, currentValue: boolean) => {
    await supabase.from('variants').update({ track_stock: !currentValue }).eq('id', id)
    fetchVariants()
  }

  const updateStock = async (id: string, newQuantity: string) => {
    const qty = parseInt(newQuantity)
    if (isNaN(qty)) return
    await supabase.from('variants').update({ stock_quantity: qty }).eq('id', id)
  }

  // --- SALES LOGIC (UPDATED) ---
  const fetchOrders = async () => {
    setLoading(true)
    // NEW: We select '*, order_items(*)' to get the nested details
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)') 
      .order('created_at', { ascending: false })

    if (error) console.error('Error fetching orders:', error)
    else setOrders(data || [])
    setLoading(false)
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>📦 Management Dashboard</h1>
        <a href="/" style={{ padding: '10px 20px', background: '#333', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          ← Back to Till
        </a>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('inventory')}
          style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', background: activeTab === 'inventory' ? 'black' : '#eee', color: activeTab === 'inventory' ? 'white' : 'black', border: 'none', borderRadius: '5px' }}>
          Inventory
        </button>
        <button 
          onClick={() => setActiveTab('sales')}
          style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', background: activeTab === 'sales' ? 'black' : '#eee', color: activeTab === 'sales' ? 'white' : 'black', border: 'none', borderRadius: '5px' }}>
          Sales History
        </button>
      </div>

      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', minHeight: '300px' }}>
        
        {loading ? (
          <div style={{ padding: '20px' }}>Loading...</div>
        ) : activeTab === 'inventory' ? (
          /* --- INVENTORY TABLE --- */
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f5f5f5' }}>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: '15px' }}>Product</th>
                <th style={{ padding: '15px' }}>Variant</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Track Stock?</th>
                <th style={{ padding: '15px' }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {variants.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{v.products?.name}</td>
                  <td style={{ padding: '15px' }}>{v.name}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <input type="checkbox" checked={v.track_stock} onChange={() => toggleStockTracking(v.id, v.track_stock)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '15px' }}>
                    {v.track_stock ? (
                      <input type="number" defaultValue={v.stock_quantity} onBlur={(e) => updateStock(v.id, e.target.value)} style={{ padding: '5px', width: '80px' }} />
                    ) : <span style={{ color: '#aaa' }}>∞ Unlimited</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* --- SALES TABLE (UPDATED) --- */
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f5f5f5' }}>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: '15px' }}>Date</th>
                <th style={{ padding: '15px' }}>Items Sold</th> {/* NEW COLUMN */}
                <th style={{ padding: '15px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                 <tr><td colSpan={3} style={{padding: '20px', textAlign: 'center'}}>No sales yet.</td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '15px', width: '200px', verticalAlign: 'top' }}>
                      {new Date(order.created_at).toLocaleString()} <br/>
                      <span style={{ fontSize: '0.8em', color: '#888' }}>ID: {order.id.slice(0, 4)}</span>
                    </td>
                    
                    {/* NEW: LIST THE ITEMS */}
                    <td style={{ padding: '15px', verticalAlign: 'top' }}>
                      {order.order_items && order.order_items.map((item: any) => (
                        <div key={item.id} style={{ marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold' }}>{item.quantity}x</span> {item.product_name_snapshot}
                        </div>
                      ))}
                    </td>

                    <td style={{ padding: '15px', fontWeight: 'bold', color: '#2e7d32', verticalAlign: 'top' }}>
                      ${(order.total_amount / 100).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}