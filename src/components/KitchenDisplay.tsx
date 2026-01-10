import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface KitchenTicket {
  id: number;
  table_number: string;
  items: { name: string; qty: number; void?: boolean }[];
  status: 'PENDING' | 'COMPLETED' | 'VOIDED';
  created_at: string;
}

export default function KitchenDisplay() {
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveTickets();

    // REAL-TIME SUBSCRIPTION: Listen for new tickets or status changes
    const channel = supabase
      .channel('kitchen_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kitchen_tickets' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            playNotificationSound();
          }
          fetchActiveTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveTickets = async () => {
    const { data, error } = await supabase
      .from('kitchen_tickets')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });

    if (!error) setTickets(data || []);
    setLoading(false);
  };

  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Audio play blocked by browser. Click anywhere to enable."));
  };

  const handleComplete = async (id: number) => {
    const { error } = await supabase
      .from('kitchen_tickets')
      .update({ status: 'COMPLETED' })
      .eq('id', id);

    if (!error) fetchActiveTickets();
  };

  const getTimeElapsed = (createdAt: string) => {
    const start = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / 1000 / 60); // Minutes
    return diff;
  };

  if (loading) return <div style={fullScreenCenter}>Loading Kitchen Feed...</div>;

  return (
    <div style={kdsContainer}>
      {/* HEADER */}
      <div style={kdsHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', letterSpacing: '2px' }}>OPENTILL KDS</h1>
          <span style={liveIndicator}>● LIVE FEED</span>
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
          {tickets.length} ACTIVE TICKETS
        </div>
      </div>

      {/* TICKET GRID */}
      <div style={ticketGrid}>
        {tickets.length === 0 ? (
          <div style={emptyState}>
            <h2>KITCHEN IS CLEAR</h2>
            <p>New orders will appear here automatically.</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const minutes = getTimeElapsed(ticket.created_at);
            const isLate = minutes >= 10;

            return (
              <div key={ticket.id} style={{
                ...ticketCard,
                borderColor: isLate ? '#d32f2f' : '#2e7d32',
                animation: 'slideIn 0.3s ease-out'
              }}>
                {/* TICKET HEADER */}
                <div style={{ ...ticketHeader, background: isLate ? '#d32f2f' : '#2e7d32' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '900' }}>{ticket.table_number}</span>
                  <span style={{ fontWeight: 'bold' }}>{minutes}m ago</span>
                </div>

                {/* TICKET ITEMS */}
                <div style={ticketBody}>
                  {ticket.items.map((item, idx) => (
                    <div key={idx} style={{
                      ...itemRow,
                      textDecoration: item.void ? 'line-through' : 'none',
                      color: item.void ? '#d32f2f' : '#fff'
                    }}>
                      <span style={itemQty}>{item.qty}x</span>
                      <span style={itemName}>{item.name}</span>
                      {item.void && <span style={voidTag}>VOIDED</span>}
                    </div>
                  ))}
                </div>

                {/* ACTION BUTTON */}
                <button 
                  onClick={() => handleComplete(ticket.id)}
                  style={completeBtn}
                >
                  COMPLETE
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// --- STYLES ---

const kdsContainer: React.CSSProperties = {
  background: '#0a0a0a',
  minHeight: '100vh',
  color: '#fff',
  fontFamily: '"Roboto Mono", monospace',
  padding: '20px',
  boxSizing: 'border-box'
};

const kdsHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 20px',
  background: '#1a1a1a',
  borderRadius: '8px',
  marginBottom: '30px',
  border: '1px solid #333'
};

const liveIndicator: React.CSSProperties = {
  color: '#4caf50',
  fontSize: '0.9rem',
  fontWeight: 'bold',
  animation: 'pulse 2s infinite'
};

const ticketGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: '20px',
  alignItems: 'start'
};

const ticketCard: React.CSSProperties = {
  background: '#1a1a1a',
  borderRadius: '12px',
  border: '2px solid',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
};

const ticketHeader: React.CSSProperties = {
  padding: '15px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#fff'
};

const ticketBody: React.CSSProperties = {
  padding: '20px',
  flexGrow: 1,
  minHeight: '150px'
};

const itemRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '1.3rem',
  marginBottom: '10px',
  padding: '8px',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '4px'
};

const itemQty: React.CSSProperties = { fontWeight: 'bold', color: '#ffeb3b' };
const itemName: React.CSSProperties = { fontWeight: 'bold' };

const voidTag: React.CSSProperties = {
  fontSize: '0.7rem',
  background: '#d32f2f',
  color: 'white',
  padding: '2px 6px',
  borderRadius: '4px',
  marginLeft: 'auto'
};

const completeBtn: React.CSSProperties = {
  width: '100%',
  padding: '20px',
  background: '#333',
  color: 'white',
  border: 'none',
  fontWeight: '900',
  fontSize: '1.1rem',
  cursor: 'pointer',
  transition: '0.2s',
  borderTop: '1px solid #444'
};

const fullScreenCenter: React.CSSProperties = {
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: '#0a0a0a',
  color: '#fff',
  fontSize: '1.5rem'
};

const emptyState: React.CSSProperties = {
  gridColumn: '1/-1',
  textAlign: 'center',
  padding: '100px',
  color: '#444'
};