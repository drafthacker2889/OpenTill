import React from 'react'

interface Props {
  total: number
  onConfirm: (method: 'CASH' | 'CARD') => void
  onCancel: () => void
}

export default function PaymentModal({ total, onConfirm, onCancel }: Props) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', // Darker background for focus
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 2000
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        width: '400px',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ marginTop: 0 }}>Confirm Payment</h2>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>Total to Pay:</p>
        <h1 style={{ fontSize: '3rem', margin: '10px 0 30px 0' }}>
          ${(total / 100).toFixed(2)}
        </h1>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          {/* CASH BUTTON */}
          <button
            onClick={() => onConfirm('CASH')}
            style={{
              flex: 1, padding: '20px', fontSize: '1.2rem', fontWeight: 'bold',
              background: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            💵 CASH
          </button>

          {/* CARD BUTTON */}
          <button
            onClick={() => onConfirm('CARD')}
            style={{
              flex: 1, padding: '20px', fontSize: '1.2rem', fontWeight: 'bold',
              background: '#1565c0', color: 'white', border: 'none', borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            💳 CARD
          </button>
        </div>

        <button 
          onClick={onCancel}
          style={{
            background: 'transparent', border: 'none', color: '#888', 
            textDecoration: 'underline', cursor: 'pointer', fontSize: '1rem'
          }}
        >
          Cancel / Go Back
        </button>
      </div>
    </div>
  )
}