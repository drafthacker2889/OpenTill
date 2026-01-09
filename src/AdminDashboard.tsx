import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('inventory') 
  const [variants, setVariants] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Inventory Form State
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('Coffee')
  const [newPrice, setNewPrice] = useState('') 
  const [newVariantName, setNewVariantName] = useState('Standard')

  // Staff Form State
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('cashier')

  useEffect(() => {
    if (activeTab === 'inventory') fetchVariants()
    else if (activeTab === 'sales') fetchOrders()
    else fetchStaff()
  }, [activeTab])

  // --- ACTIONS ---
  const fetchVariants = async () => {
    setLoading(true)
    const { data } = await supabase.from('variants').select('*, products(name, category)').order('product_id')
    setVariants(data || [])
    setLoading(false)
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newPrice) return alert("Please fill in Name and Price")

    let productId;
    const { data: existingProd } = await supabase.from('products').select('id').eq('name', newName).single()

    if (existingProd) {
      productId = existingProd.id
    } else {
      const { data: productData, error: productError } = await supabase
        .from('products').insert({ name: newName, category: newCategory }).select().single()
      if (productError) return alert(productError.message)
      productId = productData.id
    }

    const priceInCents = Math.round(parseFloat(newPrice) * 100)
    await supabase.from('variants').insert({
      product_id: productId,
      name: newVariantName,
      price: priceInCents,
      stock_quantity: 0,
      track_stock: false
    })

    setNewName(''); setNewPrice(''); setNewVariantName('Standard');
    fetchVariants()
  }

  const updateVariantField = async (id: string, field: string, value: any) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v))
    await supabase.from('variants').update({ [field]: value }).eq('id', id)
  }

  const handleDeleteVariant = async (v: any) => {
    if (!confirm(`Are you sure you want to delete this?`)) return
    await supabase.from('variants').delete().eq('id', v.id)
    fetchVariants()
  }

  const fetchOrders = async () => {
    setLoading(true)
    const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  const fetchStaff = async () => {
    setLoading(true)
    const { data } = await supabase.from('staff_directory').select('*')
    setStaff(data || [])
    setLoading(false)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.rpc('create_employee', { email: newEmail, password: newPassword, role_name: newRole })
    if (error) alert(error.message)
    else { alert("Staff created!"); fetchStaff(); }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>📦 Management Dashboard</h1>
        <a href="/" style={{ padding: '10px 20px', background: '#333', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          ← Back to Till
        </a>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['inventory', 'sales', 'staff'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            style={{
              padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold',
              background: activeTab === tab ? 'black' : '#eee',
              color: activeTab === tab ? 'white' : 'black',
              border: 'none', borderRadius: '5px'
            }}
          >
            {tab === 'staff' ? 'Manage Staff' : tab === 'sales' ? 'Sales History' : 'Inventory'}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', minHeight: '300px' }}>
        
        {loading ? (
          <div style={{ padding: '20px' }}>Loading...</div>
        ) : activeTab === 'inventory' ? (
          <div style={{ padding: '20px' }}>
            {/* ADD ITEM FORM */}
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #eee' }}>
              <h3 style={{ marginTop: 0 }}>Add New Item</h3>
              <form onSubmit={handleCreateProduct} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>Product Name</label><input placeholder="e.g. Latte" value={newName} onChange={e => setNewName(e.target.value)} style={inputStyle} /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>Variant (Size)</label><input placeholder="e.g. Small" value={newVariantName} onChange={e => setNewVariantName(e.target.value)} style={inputStyle} /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>Category</label><select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={inputStyle}><option value="Coffee">Coffee</option><option value="Snacks">Snacks</option><option value="Drinks">Drinks</option></select></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>Price ($)</label><input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={inputStyle} /></div>
                <button type="submit" style={{ padding: '10px 20px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Item</button>
              </form>
            </div>

            {/* INVENTORY TABLE */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f5f5f5' }}>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: '15px' }}>Product</th>
                  <th style={{ padding: '15px' }}>Variant</th>
                  <th style={{ padding: '15px' }}>Price ($)</th>
                  <th style={{ padding: '15px' }}>Track Stock?</th>
                  <th style={{ padding: '15px' }}>Stock Qty</th>
                  <th style={{ padding: '15px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{v.products?.name}</td>
                    <td style={{ padding: '15px' }}><input value={v.name} onChange={(e) => updateVariantField(v.id, 'name', e.target.value)} style={editInput} /></td>
                    <td style={{ padding: '15px' }}><input type="number" step="0.01" value={(v.price / 100).toFixed(2)} onChange={(e) => updateVariantField(v.id, 'price', Math.round(parseFloat(e.target.value) * 100))} style={editInput} /></td>
                    <td style={{ padding: '15px' }}><input type="checkbox" checked={v.track_stock} onChange={(e) => updateVariantField(v.id, 'track_stock', e.target.checked)} /></td>
                    <td style={{ padding: '15px' }}><input type="number" disabled={!v.track_stock} value={v.stock_quantity} onChange={(e) => updateVariantField(v.id, 'stock_quantity', parseInt(e.target.value || '0'))} style={{ ...editInput, opacity: v.track_stock ? 1 : 0.5 }} /></td>
                    <td style={{ padding: '15px' }}><button onClick={() => handleDeleteVariant(v)} style={delBtn}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'sales' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f5f5f5' }}><tr style={{ textAlign: 'left' }}><th style={{ padding: '15px' }}>Date</th><th style={{ padding: '15px' }}>Items</th><th style={{ padding: '15px' }}>Total</th></tr></thead>
            <tbody>{orders.map(order => (<tr key={order.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '15px' }}>{new Date(order.created_at).toLocaleString()}</td><td style={{ padding: '15px' }}>{order.order_items?.length} items</td><td style={{ padding: '15px', fontWeight: 'bold' }}>${(order.total_amount / 100).toFixed(2)}</td></tr>))}</tbody>
          </table>
        ) : (
          <div style={{ padding: '30px' }}>
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
              <h3>Manage Staff</h3>
              <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '10px' }}>
                <input placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inputStyle} />
                <input type="password" placeholder="Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
                <select value={newRole} onChange={e => setNewRole(e.target.value)} style={inputStyle}><option value="cashier">Cashier</option><option value="manager">Manager</option></select>
                <button type="submit" style={{ padding: '10px 20px', background: 'black', color: 'white', borderRadius: '5px' }}>Create Staff</button>
              </form>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f5f5f5' }}><tr style={{ textAlign: 'left' }}><th style={{ padding: '15px' }}>Email</th><th style={{ padding: '15px' }}>Role</th></tr></thead>
              <tbody>{staff.map(s => <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '15px' }}>{s.email}</td><td style={{ padding: '15px' }}>{s.role}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle = { fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }
const inputStyle = { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', boxSizing: 'border-box' as const }
const editInput = { border: '1px solid #ddd', padding: '5px', borderRadius: '4px', width: '80px' }
const delBtn = { background: '#ffebee', color: '#c62828', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' as const }