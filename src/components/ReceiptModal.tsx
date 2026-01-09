import React from 'react'

interface Props {
  orderId: string
  total: number
  items: any[]
  onClose: () => void
}

export default function ReceiptModal({ orderId, total, items, onClose }: Props) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="receipt" style={{
        background: 'white',
        padding: '40px',
        width: '300px',
        fontFamily: 'Courier New, monospace', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        textAlign: 'center'
      }}>
        
        {/* SHOP HEADER */}
        <h2 style={{ marginBottom: '5px', textTransform: 'uppercase' }}>OpenTill Coffee</h2>
        <p style={{ fontSize: '0.8rem', margin: 0 }}>123 Code Street, Tech City</p>
        <p style={{ fontSize: '0.8rem', margin: 0 }}>Tel: 555-0199</p>
        <div style={{ borderBottom: '1px dashed #000', margin: '15px 0' }}></div>

        {/* ORDER DETAILS */}
        <div style={{ textAlign: 'left', fontSize: '0.9rem' }}>
          <p><strong>Order #:</strong> {orderId.slice(0, 8)}</p>
          <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
        </div>
        <div style={{ borderBottom: '1px dashed #000', margin: '15px 0' }}></div>

        {/* ITEMS LIST - FIXED */}
        <div style={{ textAlign: 'left', fontSize: '0.9rem', marginBottom: '15px' }}>
          {items.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              
              {/* --- FIX IS HERE: Show the full name, replacing brackets with a dash --- */}
              <span>{item.quantity}x {item.name.replace('(', '- ').replace(')', '')}</span>
              
              <span>${(item.price * item.quantity / 100).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div style={{ borderBottom: '1px dashed #000', margin: '15px 0' }}></div>

        {/* TOTAL */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
          <span>TOTAL</span>
          <span>${(total / 100).toFixed(2)}</span>
        </div>

        <div style={{ borderBottom: '1px dashed #000', margin: '20px 0' }}></div>
        <p style={{ fontSize: '0.8rem' }}>Thank you for your business!</p>

        {/* BUTTONS */}
        <div className="no-print" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button 
            onClick={onClose}
            style={{ flex: 1, padding: '10px', background: '#eee', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Close
          </button>
          <button 
            onClick={handlePrint}
            style={{ flex: 1, padding: '10px', background: 'black', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Print
          </button>
        </div>

      </div>
    </div>
  )
}