import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

interface AuditLog {
  id: string;
  action_type: string;
  created_at: string;
  details: any;
  user_id: string;
}

export default function AuditLogViewer({ branchId }: { branchId: string | null }) {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState('');
  const [users, setUsers] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, [branchId]);

  const fetchUsers = async () => {
    // Ideally use profiles or staff directory
    const { data } = await supabase.from('staff_directory').select('user_id, first_name');
    if (data) {
        const map: any = {};
        data.forEach((u: any) => map[u.user_id] = u.first_name);
        setUsers(map);
    }
  };

  const fetchLogs = async () => {
    let q = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (branchId) q = q.eq('branch_id', branchId);
    
    const { data } = await q;
    setLogs(data || []);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🛡️ Security Audit Logs</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>Time</th>
            <th style={{ padding: '10px' }}>User</th>
            <th style={{ padding: '10px' }}>Action</th>
            <th style={{ padding: '10px' }}>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{new Date(log.created_at).toLocaleString()}</td>
              <td style={{ padding: '10px' }}>{users[log.user_id] || log.user_id?.substring(0,8)}</td>
              <td style={{ padding: '10px' }}>
                <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                    background: log.action_type.includes('VOID') ? '#ffebee' : '#e3f2fd',
                    color: log.action_type.includes('VOID') ? '#c62828' : '#1565c0'
                }}>
                    {log.action_type}
                </span>
              </td>
              <td style={{ padding: '10px', fontSize: '0.9rem', color: '#555' }}>
                  {JSON.stringify(log.details)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
