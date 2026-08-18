import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Onboarding() {
  const [mode, setMode] = useState('create') // create | join
  const [channelName, setChannelName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const { createChannel, joinChannel, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'create') {
        await createChannel(channelName.trim())
      } else {
        await joinChannel(joinCode.trim())
      }
      navigate('/')
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">Set up your workspace</div>
        <div className="auth-subtitle">Create a new channel as admin, or join an existing one with a code your admin shared.</div>

        <div className="radio-row">
          <label>
            <input type="radio" checked={mode === 'create'} onChange={() => setMode('create')} /> Create channel (Admin)
          </label>
          <label>
            <input type="radio" checked={mode === 'join'} onChange={() => setMode('join')} /> Join with code
          </label>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'create' ? (
            <div className="form-group">
              <label className="form-label">Channel Name</label>
              <input className="form-input" value={channelName} onChange={e => setChannelName(e.target.value)} required placeholder="e.g. Home Budget" />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Join Code</label>
              <input className="form-input" value={joinCode} onChange={e => setJoinCode(e.target.value)} required placeholder="e.g. AB3C9F" style={{ textTransform: 'uppercase' }} />
            </div>
          )}
          <button className="btn btn-block" type="submit" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'create' ? 'Create Channel' : 'Join Channel'}
          </button>
        </form>

        <button className="btn btn-secondary btn-block" style={{ marginTop: 10 }} onClick={signOut} type="button">
          Log out
        </button>
      </div>
    </div>
  )
}
