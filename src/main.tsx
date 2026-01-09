import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { supabase } from './supabaseClient'
import Root from './Root'
import AdminDashboard from './AdminDashboard'
import Login from './components/Login'
// REMOVED: import './index.css' <--- This was the cause of the crash!

function App() {
  const [session, setSession] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else setLoading(false)
    })

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else {
        setUserRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('id', userId)
      .single()
    
    setUserRole(data?.role || 'cashier') 
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading System...</div>

  if (!session) return <Login />

  const path = window.location.pathname

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/" 
  }

  // ADMIN PAGE 
  if (path === '/admin') {
    if (userRole !== 'manager') {
      return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <h1>⛔ Access Denied</h1>
          <p>Only Managers can view this page.</p>
          <a href="/" style={{ color: 'blue' }}>Go Back to Till</a>
        </div>
      )
    }
    return <AdminDashboard />
  }

  // POS PAGE
  return (
    <div>
      <div style={{ 
        background: '#333', color: 'white', padding: '10px 20px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' 
      }}>
        <span>
          Logged in as: <strong>{session.user.email}</strong> ({userRole?.toUpperCase()})
        </span>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          {userRole === 'manager' && (
             <a href="/admin" style={{ color: '#4caf50', textDecoration: 'none', fontWeight: 'bold' }}>
               ⚙️ Dashboard
             </a>
          )}
          <button 
            onClick={handleLogout}
            style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <Root />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)