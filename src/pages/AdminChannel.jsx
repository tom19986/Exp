import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'

export default function AdminChannel() {
  const { channel, members, profile, refreshProfile } = useAuth()
  const [copied, setCopied] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(channel.join_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const removeMember = async (id) => {
    if (id === profile.id) return
    if (!confirm('Remove this member from the channel? Their past transactions will remain, but they will lose access.')) return
    await supabase.from('profiles').update({ channel_id: null, role: 'member' }).eq('id', id)
    refreshProfile()
  }

  if (profile?.role !== 'admin') {
    return <div className="empty-state">Only the channel admin can view this page.</div>
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Channel Admin</h1>
          <div className="page-subtitle">Manage {channel?.name} and its members</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, maxWidth: 480 }}>
        <div className="section-title">Invite members</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: -6, marginBottom: 12 }}>
          Share this code. New users sign up, choose "Join with code", and enter it to join this channel.
        </p>
        <div className="join-code-box">
          <span className="join-code-value">{channel?.join_code}</span>
          <button className="btn btn-secondary btn-sm" onClick={copyCode}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Members ({members.length})</div>
        <div className="table-wrap" style={{ boxShadow: 'none', border: 'none' }}>
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>{m.full_name}{m.id === profile.id && ' (You)'}</td>
                  <td>{m.email}</td>
                  <td style={{ textTransform: 'capitalize' }}>{m.role}</td>
                  <td>{m.created_at?.slice(0, 10)}</td>
                  <td>
                    {m.id !== profile.id && (
                      <button className="icon-btn" onClick={() => removeMember(m.id)} title="Remove from channel">🗑️</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
