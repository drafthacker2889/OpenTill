import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

// Define Tax Rule Interface
interface TaxRule {
  id: string;
  name: string;
  rate: number;
  is_default: boolean;
}

export default function TaxRuleManager() {
  const { t } = useTranslation();
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    const { data } = await supabase.from('tax_rules').select('*').order('created_at');
    if (data) setRules(data);
  };

  const handleCreate = async () => {
    if (!newName || !newRate) return;
    setLoading(true);
    const { error } = await supabase.from('tax_rules').insert({
        name: newName,
        rate: Number(newRate),
        branch_id: null // Global for now, or fetch active branch
    });
    
    if (error) alert("Error: " + error.message);
    else {
        setNewName('');
        setNewRate('');
        fetchRules();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
      const { error } = await supabase.from('tax_rules').delete().eq('id', id);
      if (!error) fetchRules();
  };

  const handleSetDefault = async (id: string) => {
      // Unset all, then set one
      await supabase.from('tax_rules').update({ is_default: false }).neq('id', '00000000-0000-0000-0000-000000000000'); // hacky eq
      await supabase.from('tax_rules').update({ is_default: true }).eq('id', id);
      fetchRules();
  };

  return (
    <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
      <h3 style={{ marginTop: 0 }}>Advanced Tax Rules</h3>
      <p style={{ fontSize: '0.9rem', color: '#666' }}>Define specific tax rates (e.g., VAT, Alcohol).</p>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
         <input 
            placeholder="Tax Name (e.g. Alcohol)" 
            value={newName} 
            onChange={e => setNewName(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
         />
         <input 
            type="number"
            placeholder="Rate %" 
            value={newRate} 
            onChange={e => setNewRate(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '80px' }}
         />
         <button 
            onClick={handleCreate}
            disabled={loading}
            style={{ padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
         >
            Add Rule
         </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
            <tr style={{ background: '#eee', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Name</th>
                <th style={{ padding: '8px' }}>Rate</th>
                <th style={{ padding: '8px' }}>Status</th>
                <th style={{ padding: '8px' }}>Action</th>
            </tr>
        </thead>
        <tbody>
            {rules.map(rule => (
                <tr key={rule.id} style={{ borderBottom: '1px solid #ddd', background: '#fff' }}>
                    <td style={{ padding: '8px' }}>{rule.name}</td>
                    <td style={{ padding: '8px' }}>{rule.rate}%</td>
                    <td style={{ padding: '8px' }}>
                        {rule.is_default ? (
                            <span style={{ color: 'green', fontWeight: 'bold' }}>Default</span>
                        ) : (
                            <button 
                              onClick={() => handleSetDefault(rule.id)}
                              style={{ border: 'none', background: 'none', color: '#1976d2', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Set Default
                            </button>
                        )}
                    </td>
                    <td style={{ padding: '8px' }}>
                        <button 
                            onClick={() => handleDelete(rule.id)}
                            style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}
                        >
                            Delete
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
