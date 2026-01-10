import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

interface DiningTable {
  id: number
  table_number: string
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
}

interface Props {
  onSelect: (tableName: string) => void
}

export default function TableSelection({ onSelect }: Props) {
  const [tables, setTables] = useState<DiningTable[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch tables from the database you just set up with SQL
  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('dining_tables')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error("Error fetching tables:", error.message)
    } else {
      setTables(data || [])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontSize: '1.2rem' }}>
        Loading Floor Plan...
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      height: '100%', 
      overflowY: 'auto',
      boxSizing: 'border-box',
      background: '#f9f9f9'
    }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', fontWeight: '800' }}>Floor Plan</h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>Select an available table to begin a new order.</p>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
        gap: '25px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {tables.length === 0 ? (
          <p style={{ gridColumn: '1/-1', color: '#999' }}>No tables configured in database.</p>
        ) : (
          tables.map(table => (
            <button 
              key={table.id} 
              onClick={() => onSelect(table.table_number)}
              disabled={table.status === 'OCCUPIED'}
              style={{ 
                padding: '45px 20px', 
                fontSize: '1.3rem', 
                fontWeight: 'bold', 
                borderRadius: '20px', 
                border: '2px solid',
                borderColor: table.status === 'AVAILABLE' ? '#eee' : '#ffcdd2', 
                background: table.status === 'AVAILABLE' ? 'white' : '#ffebee',
                color: table.status === 'AVAILABLE' ? '#111' : '#c62828',
                cursor: table.status === 'AVAILABLE' ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}
              // Hover effect for available tables
              onMouseOver={(e) => {
                if (table.status === 'AVAILABLE') {
                  e.currentTarget.style.borderColor = '#111';
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                }
              }}
              onMouseOut={(e) => {
                if (table.status === 'AVAILABLE') {
                  e.currentTarget.style.borderColor = '#eee';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                }
              }}
            >
              {table.table_number}
              <span style={{ 
                fontSize: '0.7rem', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: table.status === 'AVAILABLE' ? '#e8f5e9' : '#ffcdd2',
                color: table.status === 'AVAILABLE' ? '#2e7d32' : '#c62828'
              }}>
                {table.status}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div style={{ marginTop: '50px', color: '#aaa', fontSize: '0.9rem' }}>
        Table configurations can be managed in the Admin Dashboard.
      </div>
    </div>
  )
}