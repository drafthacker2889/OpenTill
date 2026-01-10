import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import ReceiptModal from './components/ReceiptModal'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('inventory') 
  const [variants, setVariants] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([]) 
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // State for the Receipt Modal
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any>(null)

  // FILTER & SEARCH STATES
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderSearch, setOrderSearch] = useState('');

  // FORM STATES
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('Coffee')
  const [newPrice, setNewPrice] = useState('') 
  const [newVariantName, setNewVariantName] = useState('Standard')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('cashier')

  useEffect(() => {
    if (activeTab === 'inventory') fetchVariants()
    else if (activeTab === 'sales') fetchOrders()
    else fetchStaff()
  }, [activeTab])

  // --- DATA FETCHING ---
  const fetchVariants = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('variants')
      .select('*, products(name, category)')
      .order('name')
    setVariants(data || [])
    setLoading(false)
  }

  const fetchOrders = async () => {
    setLoading(true)
    // FIX: Added all necessary fields for the ReceiptModal
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          price_at_sale,
          product_name_snapshot,
          variant_id,
          variants (name)
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) console.error("Sales Fetch Error:", error)
    setOrders(data || [])
    setLoading(false)
  }

  const fetchStaff = async () => {
    setLoading(true)
    const { data } = await supabase.from('staff_directory').select('*')
    setStaff(data || [])
    setLoading(false)
  }

  // --- VOID ORDER LOGIC ---
  const handleVoidOrder = async (order: any) => {
    if (!confirm("Void this order? Revenue will be deducted and stock will be returned.")) return;

    // We keep the original total_amount but change status to VOIDED for reporting
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'VOIDED' })
      .eq('id', order.id);

    if (updateError) return alert("Void failed: " + updateError.message);

    // Stock Reconciliation
    for (const item of order.order_items) {
      if (item.variant_id) {
        const { data: v } = await supabase.from('variants').select('stock_quantity, track_stock').eq('id', item.variant_id).single();
        if (v?.track_stock) {
          await supabase.from('variants').update({ stock_quantity: (v.stock_quantity || 0) + item.quantity }).eq('id', item.variant_id);
        }
      }
    }
    alert("Order Voided Successfully");
    fetchOrders();
  };

  // --- ANALYTICS & SEARCH LOGIC ---
  const filteredOrders = orders.filter(o => {
    const matchesDate = new Date(o.created_at).toISOString().split('T')[0] === selectedDate;
    const shortId = o.id.split('-')[0].toUpperCase();
    const matchesSearch = o.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
                          shortId.includes(orderSearch.toUpperCase()) ||
                          o.order_items?.some((i: any) => i.product_name_snapshot.toLowerCase().includes(orderSearch.toLowerCase()));
    return matchesDate && matchesSearch;
  });

  // Financial summary excluding VOIDED orders
  const dailyTotal = filteredOrders
    .filter(o => o.status !== 'VOIDED')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0) / 100;

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayTotal = orders
      .filter(o => o.status !== 'VOIDED' && new Date(o.created_at).toISOString().split('T')[0] === dateStr)
      .reduce((sum, o) => sum + (o.total_amount || 0), 0) / 100;
    return { date: dateStr, label: d.toLocaleDateString([], { weekday: 'short' }), total: dayTotal };
  }).reverse();

  const maxWeeklyTotal = Math.max(...last7Days.map(d => d.total), 1);

  // --- INVENTORY ACTIONS ---
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newPrice) return alert("Please fill in Name and Price")
    
    let productId;
    const { data: existingProd } = await supabase.from('products').select('id').eq('name', newName).single()
    
    if (existingProd) { productId = existingProd.id } 
    else {
      const { data: pData } = await supabase.from('products').insert({ name: newName, category: newCategory }).select().single()
      productId = pData.id
    }

    await supabase.from('variants').insert({ 
      product_id: productId, 
      name: newVariantName, 
      price: Math.round(parseFloat(newPrice) * 100),
      stock_quantity: 10,
      track_stock: true 
    })

    setNewName(''); setNewPrice(''); fetchVariants()
  }

  const updateVariantField = async (id: string, field: string, value: any) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v))
    await supabase.from('variants').update({ [field]: value }).eq('id', id)
  }

  const handleDeleteVariant = async (v: any) => {
    if (confirm(`Delete ${v.products?.name}?`)) {
      await supabase.from('variants').delete().eq('id', v.id)
      fetchVariants()
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.rpc('create_employee', { email: newEmail, password: newPassword, role_name: newRole })
    if (error) alert(error.message); else { alert("Staff created!"); fetchStaff(); }
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: '#333' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
           <h1 style={{ margin: 0 }}>📦 Admin Portal</h1>
           <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Real-time management for OpenTill POS.</p>
        </div>
        <a href="/" style={{ padding: '10px 20px', background: '#333', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
          ← Back to Till
        </a>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '25px' }}>
        {['inventory', 'sales', 'staff'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            style={{ 
              padding: '12px 24px', cursor: 'pointer', fontWeight: 'bold', border: 'none', borderRadius: '8px',
              background: activeTab === tab ? '#000' : '#eee', 
              color: activeTab === tab ? '#fff' : '#000', transition: '0.2s'
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', minHeight: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center' }}>Refreshing data...</div>
        ) : activeTab === 'inventory' ? (
          <div style={{ padding: '20px' }}>
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #eee' }}>
              <form onSubmit={handleCreateProduct} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 2 }}><label style={labelStyle}>Product Name</label><input value={newName} onChange={e => setNewName(e.target.value)} style={inputStyle} /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>Price ($)</label><input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={inputStyle} /></div>
                <button type="submit" style={{ padding: '11px 20px', background: '#1b5e20', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add</button>
              </form>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#fafafa' }}>
                  <th style={thStyle}>Product</th><th style={thStyle}>Price</th><th style={thStyle}>Stock Tracking</th><th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {variants.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}><strong>{v.products?.name}</strong> ({v.name})</td>
                    <td style={tdStyle}>
                      <input type="number" step="0.01" value={(v.price / 100).toFixed(2)} onChange={(e) => updateVariantField(v.id, 'price', Math.round(parseFloat(e.target.value) * 100))} style={editInput} />
                    </td>
                    <td style={tdStyle}>
                      <input type="checkbox" checked={v.track_stock} onChange={(e) => updateVariantField(v.id, 'track_stock', e.target.checked)} />
                      <input type="number" disabled={!v.track_stock} value={v.stock_quantity} onChange={(e) => updateVariantField(v.id, 'stock_quantity', parseInt(e.target.value || '0'))} style={{ ...editInput, marginLeft: '10px', opacity: v.track_stock ? 1 : 0.3 }} />
                    </td>
                    <td style={tdStyle}><button onClick={() => handleDeleteVariant(v)} style={delBtn}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        ) : activeTab === 'sales' ? (
          <div style={{ padding: '25px' }}>
            {/* WEEKLY TREND CHART */}
            <div style={{ marginBottom: '30px', padding: '20px', background: '#fff', border: '1px solid #eee', borderRadius: '10px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem' }}>Revenue Trends (Last 7 Days)</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', height: '120px' }}>
                {last7Days.map(day => (
                  <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>${day.total.toFixed(0)}</div>
                    <div style={{ width: '100%', background: day.date === selectedDate ? '#2e7d32' : '#e0e0e0', height: `${(day.total / maxWeeklyTotal) * 100}px`, borderRadius: '3px 3px 0 0' }}></div>
                    <div style={{ fontSize: '0.65rem', color: '#666' }}>{day.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', alignItems: 'flex-end' }}>
               <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Search History</label>
                  <input placeholder="Search #ID or Product..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} style={{ ...inputStyle, width: '100%', border: '2px solid #eee' }} />
               </div>
               <div>
                  <label style={labelStyle}>Date</label>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={inputStyle} />
               </div>
               <div style={{ textAlign: 'right', background: '#e8f5e9', padding: '10px 20px', borderRadius: '8px', border: '1px solid #c8e6c9', minWidth: '150px' }}>
                  <small style={{ color: '#2e7d32', fontWeight: 'bold' }}>{filteredOrders.length} ORDERS</small>
                  <h2 style={{ margin: 0, color: '#1b5e20' }}>${dailyTotal.toFixed(2)}</h2>
               </div>
            </div>

            {/* SALES TABLE */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#fafafa', borderBottom: '2px solid #eee' }}>
                  <th style={thStyle}>Order ID</th><th style={thStyle}>Items Sold</th><th style={thStyle}>Total</th><th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(sale => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid #eee', opacity: sale.status === 'VOIDED' ? 0.5 : 1 }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 'bold', color: '#1a73e8', fontSize: '0.8rem' }}>#{sale.id.split('-')[0].toUpperCase()}</div>
                      <div style={{ color: '#999', fontSize: '0.75rem' }}>{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      {sale.status === 'VOIDED' && <div style={{color:'red', fontSize:'0.7rem', fontWeight:'bold'}}>VOIDED</div>}
                    </td>
                    <td style={tdStyle}>
                      {sale.order_items?.map((item: any, i: number) => (
                        <div key={i} style={{ fontSize: '0.9rem' }}>{item.quantity}x {item.product_name_snapshot}</div>
                      ))}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 'bold' }}>${((sale.total_amount || 0) / 100).toFixed(2)}</td>
                    <td style={tdStyle}>
                      <div style={{display:'flex', gap: '8px'}}>
                        <button onClick={() => setSelectedReceiptOrder(sale)} style={btnStyle}>Print</button>
                        {sale.status !== 'VOIDED' && <button onClick={() => handleVoidOrder(sale)} style={{...btnStyle, color: 'red'}}>Void</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '20px' }}>
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #eee' }}>
              <h3>Staff Directory</h3>
              <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '10px' }}>
                <input placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inputStyle} />
                <input type="password" placeholder="Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
                <button type="submit" style={{ padding: '10px 20px', background: 'black', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Create Account</button>
              </form>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left', background: '#fafafa' }}><th style={thStyle}>Email</th><th style={thStyle}>Role</th></tr></thead>
              <tbody>{staff.map(s => <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}><td style={tdStyle}>{s.email}</td><td style={tdStyle}>{s.role.toUpperCase()}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECEIPT MODAL INTEGRATION */}
      {selectedReceiptOrder && (
        <ReceiptModal 
          orderId={selectedReceiptOrder.id}
          subtotal={selectedReceiptOrder.total_amount} 
          discount={selectedReceiptOrder.discount_amount || 0}
          tip={selectedReceiptOrder.tip_amount || 0}
          total={selectedReceiptOrder.total_amount}
          paymentMethod={selectedReceiptOrder.payment_method || 'Cash'} 
          items={selectedReceiptOrder.order_items.map((i: any) => ({
             name: i.product_name_snapshot,
             price: i.price_at_sale,
             quantity: i.quantity
          }))}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  )
}

const labelStyle = { fontSize: '0.7rem', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#666', textTransform: 'uppercase' as const }
const inputStyle = { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', boxSizing: 'border-box' as const }
const editInput = { padding: '5px', border: '1px solid #ccc', borderRadius: '4px', width: '80px' }
const thStyle = { padding: '12px 20px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' as const }
const tdStyle = { padding: '15px 20px' }
const delBtn = { background: 'none', color: '#d32f2f', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }
const btnStyle = { border: '1px solid #ddd', background: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' as const }