import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{ 
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: '#f5f5f5', fontFamily: 'sans-serif' 
    }}>
      <form onSubmit={handleLogin} style={{ 
        background: 'white', padding: '40px', borderRadius: '8px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '300px' 
      }}>
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>☕ OpenTill Login</h2>
        
        {error && <div style={{ color: 'red', marginBottom: '15px', fontSize: '0.9rem' }}>{error}</div>}
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', padding: '12px', background: 'black', color: 'white', 
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}