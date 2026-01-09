import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('inventory') // 'inventory', 'sales', 'staff'
  const [variants, setVariants] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // New Staff Form State
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('cashier')

  useEffect(() => {
    if (activeTab === 'inventory') fetchVariants()
    else if (activeTab === 'sales') fetchOrders()
    else fetchStaff()
  }, [activeTab])

  // --- 1. INVENTORY ---
  const fetchVariants = async () => {
    setLoading(true)
    const { data } = await supabase.from('variants').select('*, products(name)').order('product_id')
    setVariants(data || [])
    setLoading(false)
  }
  const toggleStockTracking = async (id: string, val: boolean) => {
    await supabase.from('variants').update({ track_stock: !val }).eq('id', id)
    fetchVariants()
  }
  const updateStock = async (id: string, qty: string) => {
    await supabase.from('variants').update({ stock_quantity: parseInt(qty) }).eq('id', id)
  }

  // --- 2. SALES ---
  const fetchOrders = async () => {
    setLoading(true)
    const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  // --- 3. STAFF (NEW) ---
  const fetchStaff = async () => {
    setLoading(true)
    // We fetch from the secure view we created
    const { data, error } = await supabase.from('staff_directory').select('*')
    if (error) console.error('Staff error:', error)
    else setStaff(data || [])
    setLoading(false)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || !newPassword) return alert("Fill in all fields")

    const { error } = await supabase.rpc('create_employee', {
      email: newEmail,
      password: newPassword,
      role_name: newRole
    })

    if (error) {
      console.error(error)
      alert("Failed to create user: " + error.message)
    } else {
      alert("User Created Successfully!")
      setNewEmail('')
      setNewPassword('')
      fetchStaff() // Refresh list
    }
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
        {['inventory', 'sales', 'staff'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'capitalize',
              background: activeTab === tab ? 'black' : '#eee',
              color: activeTab === tab ? 'white' : 'black',
              border: 'none', borderRadius: '5px'
            }}
          >
            {tab === 'staff' ? 'Manage Staff' : tab === 'sales' ? 'Sales History' : 'Inventory'}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', minHeight: '300px' }}>
        
        {loading ? (
          <div style={{ padding: '20px' }}>Loading...</div>
        ) : activeTab === 'inventory' ? (
          
          /* --- INVENTORY TABLE --- */
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f5f5f5' }}>
              <tr style={{ textAlign: 'left' }}><th style={{ padding: '15px' }}>Product</th><th style={{ padding: '15px' }}>Variant</th><th style={{ padding: '15px' }}>Track?</th><th style={{ padding: '15px' }}>Stock</th></tr>
            </thead>
            <tbody>
              {variants.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{v.products?.name}</td>
                  <td style={{ padding: '15px' }}>{v.name}</td>
                  <td style={{ padding: '15px' }}><input type="checkbox" checked={v.track_stock} onChange={() => toggleStockTracking(v.id, v.track_stock)} /></td>
                  <td style={{ padding: '15px' }}>{v.track_stock ? <input type="number" defaultValue={v.stock_quantity} onBlur={(e) => updateStock(v.id, e.target.value)} style={{ width: '60px' }} /> : '∞'}</td>
                </tr>
              ))}
            </tbody>
          </table>

        ) : activeTab === 'sales' ? (

          /* --- SALES TABLE --- */
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f5f5f5' }}>
              <tr style={{ textAlign: 'left' }}><th style={{ padding: '15px' }}>Date</th><th style={{ padding: '15px' }}>Items</th><th style={{ padding: '15px' }}>Total</th></tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px' }}>{new Date(order.created_at).toLocaleString()}</td>
                  <td style={{ padding: '15px' }}>{order.order_items?.length} items</td>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>${(order.total_amount / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

        ) : (

          /* --- STAFF MANAGEMENT (NEW) --- */
          <div style={{ padding: '30px' }}>
            
            {/* 1. ADD NEW STAFF FORM */}
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #eee' }}>
              <h3 style={{ marginTop: 0 }}>Add New Employee</h3>
              <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Email</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="employee@test.com" style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="******" style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
                </div>
                <div style={{ width: '150px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Role</label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: '100%', padding: '9px', marginTop: '5px' }}>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <button type="submit" style={{ padding: '10px 20px', background: 'black', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  + Create User
                </button>
              </form>
            </div>

            {/* 2. STAFF LIST TABLE */}
            <h3>Staff Directory</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #eee' }}>
              <thead style={{ background: '#f5f5f5' }}>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Role</th>
                  <th style={{ padding: '12px' }}>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{s.email}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                        background: s.role === 'manager' ? '#e3f2fd' : '#eee',
                        color: s.role === 'manager' ? '#1565c0' : '#333'
                      }}>
                        {s.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#666' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}
      </div>
    </div>
  )
}