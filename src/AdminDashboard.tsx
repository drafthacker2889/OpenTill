import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function AdminDashboard() {
  const [variants, setVariants] = useState<any[]>([])

  useEffect(() => {
    fetchVariants()
  }, [])

  const fetchVariants = async () => {
    // We get the Variant AND the Product Name it belongs to
    const { data, error } = await supabase
      .from('variants')
      .select('*, products(name)')
      .order('product_id')
      
    if (error) console.error('Error fetching data:', error)
    else setVariants(data || [])
  }

  // The Logic to toggle the "Master Switch"
  const toggleStockTracking = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('variants')
      .update({ track_stock: !currentValue })
      .eq('id', id)
    
    if (error) {
      alert("Error updating database")
    } else {
      fetchVariants() // Refresh the list to show the change
    }
  }

  // Logic to update the stock number manually
  const updateStock = async (id: string, newQuantity: string) => {
    const qty = parseInt(newQuantity)
    if (isNaN(qty)) return

    await supabase.from('variants').update({ stock_quantity: qty }).eq('id', id)
    fetchVariants()
  }

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>📦 Management Dashboard</h1>
        <a href="/" style={{ padding: '10px 20px', background: '#333', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          ← Back to Till
        </a>
      </div>

      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
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
                
                {/* THE MASTER SWITCH */}
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={v.track_stock} 
                    onChange={() => toggleStockTracking(v.id, v.track_stock)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </td>

                {/* STOCK INPUT */}
                <td style={{ padding: '15px' }}>
                  {v.track_stock ? (
                    <input 
                      type="number" 
                      defaultValue={v.stock_quantity}
                      onBlur={(e) => updateStock(v.id, e.target.value)}
                      style={{ padding: '5px', width: '80px' }}
                    />
                  ) : (
                    <span style={{ color: '#aaa' }}>∞ Unlimited</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}