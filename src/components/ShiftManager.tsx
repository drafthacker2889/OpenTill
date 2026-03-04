import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

interface Shift {
  id: string;
  opened_at: string;
  closed_at: string | null;
  opening_cash: number;
  expected_cash: number;
  actual_cash: number | null;
  branch_id: string;
}

export default function ShiftManager() {
  const { t } = useTranslation();
  const [branchId, setBranchId] = useState<string | null>(null);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    fetchBranchAndShift();
  }, []);

  const fetchBranchAndShift = async () => {
    try {
        setLoading(true);
        // 1. Get Branch
        const { data: branches } = await supabase.from('branches').select('id').limit(1);
        if (!branches || branches.length === 0) {
            alert("No branches found. Please set up a branch.");
            setLoading(false);
            return;
        }
        const bId = branches[0].id;
        setBranchId(bId);

        // 2. Get Open Shift
        const { data: shifts, error } = await supabase
            .from('shift_closings')
            .select('*')
            .eq('branch_id', bId)
            .is('closed_at', null)
            .limit(1);

        if (error) throw error;

        if (shifts && shifts.length > 0) {
            setCurrentShift(shifts[0]);
        } else {
            setCurrentShift(null);
        }
    } catch (err: any) {
        console.error("Error fetching shift:", err);
    } finally {
        setLoading(false);
    }
  };

  const startShift = async () => {
    if (!branchId) return;
    const amount = Number(openingCash);
    if (isNaN(amount)) return alert("Invalid amount");

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('shift_closings').insert({
        branch_id: branchId,
        opened_at: new Date().toISOString(),
        opening_cash: amount,
        opened_by: user?.id
    });

    if (error) alert("Error starting shift: " + error.message);
    else {
        setOpeningCash('');
        fetchBranchAndShift();
    }
  };

  const endShift = async () => {
    if (!currentShift) return;
    const actual = Number(closingCash);
    if (isNaN(actual)) return alert("Invalid amount");

    setLoading(true);
    
    // Call RPC to close shift safely
    const { data, error } = await supabase.rpc('close_shift', {
        shift_id: currentShift.id,
        actual_cash_counted: actual,
        notes: notes
    });

    if (error) {
        alert("Error closing shift: " + error.message);
    } else {
        // Data contains the Z-Report summary
        setReport(data);
        setCurrentShift(null); // Shift is now closed
        setClosingCash('');
        setNotes('');
    }
    setLoading(false);
  };

  if (loading && !report) return <div>Loading Shift Data...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🏪 Shift Management</h2>
      
      {report ? (
        <div style={{ background: '#fff', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>✅ Z-Report Generated</h3>
            <p><strong>Shift ID:</strong> {report.shift_id}</p>
            <p><strong>Closed At:</strong> {new Date(report.closed_at).toLocaleString()}</p>
            <hr />
            <p><strong>Opening Float:</strong> ${report.opening_cash?.toFixed(2)}</p>
            <p><strong>Total Sales (Cash):</strong> ${report.cash_sales?.toFixed(2)}</p>
            <p><strong>Total Sales (Card):</strong> ${report.card_sales?.toFixed(2)}</p>
            <hr />
            <p><strong>Expected Cash:</strong> ${report.expected_cash?.toFixed(2)}</p>
            <p><strong>Actual Count:</strong> ${report.actual_cash?.toFixed(2)}</p>
            <p style={{ color: report.variance < 0 ? 'red' : 'green', fontWeight: 'bold' }}>
                Variance: ${report.variance?.toFixed(2)}
            </p>
            <button 
                onClick={() => setReport(null)}
                style={{ marginTop: '20px', padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                Start New Shift
            </button>
            <button 
                onClick={() => window.print()}
                style={{ marginLeft: '10px', padding: '10px 20px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                Print Report
            </button>
        </div>
      ) : currentShift ? (
        <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '8px' }}>
            <h3>Current Shift: OPEN</h3>
            <p>Started: {new Date(currentShift.opened_at).toLocaleString()}</p>
            <p>Opening Float: ${currentShift.opening_cash.toFixed(2)}</p>
            
            <div style={{ marginTop: '20px', background: '#fff', padding: '15px', borderRadius: '8px' }}>
                <h4>End Shift (Z-Report)</h4>
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Total Cash Counted ($)</label>
                    <input 
                        type="number" 
                        value={closingCash}
                        onChange={e => setClosingCash(e.target.value)}
                        style={{ width: '100%', padding: '8px', fontSize: '1.2rem' }}
                        placeholder="0.00"
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Notes</label>
                    <textarea 
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        style={{ width: '100%', padding: '8px', height: '60px' }}
                        placeholder="Any discrepancies?"
                    />
                </div>
                <button 
                    onClick={endShift}
                    style={{ background: '#d32f2f', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', width: '100%' }}
                >
                    Close Shift & Generate Z-Report
                </button>
            </div>
        </div>
      ) : (
        <div style={{ background: '#f5f5f5', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
            <h3>No Active Shift</h3>
            <p>Start a new shift to begin tracking sales and cash.</p>
            
            <div style={{ maxWidth: '300px', margin: '20px auto', textAlign: 'left' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Opening Float Amount ($)</label>
                <input 
                    type="number" 
                    value={openingCash}
                    onChange={e => setOpeningCash(e.target.value)}
                    style={{ width: '100%', padding: '10px', fontSize: '1.2rem', marginBottom: '15px' }}
                    placeholder="200.00"
                />
                <button 
                    onClick={startShift}
                    style={{ background: '#2e7d32', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', fontSize: '1.2rem', cursor: 'pointer', width: '100%' }}
                >
                    Start Shift
                </button>
            </div>
        </div>
      )}
    </div>
  );
}
