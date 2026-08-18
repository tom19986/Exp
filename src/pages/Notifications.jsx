import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { pushSupported, notificationPermission, enableDailyReminder, disableDailyReminder, isReminderEnabled } from '../lib/push'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function formatHour(h) {
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:00 ${period}`
}

export default function Notifications() {
  const { profile, channel } = useAuth()
  const [supported, setSupported] = useState(true)
  const [permission, setPermission] = useState('default')
  const [enabled, setEnabled] = useState(false)
  const [hour, setHour] = useState(20)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setSupported(pushSupported())
    setPermission(notificationPermission())
    isReminderEnabled().then(setEnabled)
  }, [])

  const handleEnable = async () => {
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      await enableDailyReminder(profile.id, channel.id, hour)
      setEnabled(true)
      setPermission(notificationPermission())
      setSuccess(`Daily reminder set for ${formatHour(hour)} IST.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleDisable = async () => {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await disableDailyReminder()
      setEnabled(false)
      setSuccess('Daily reminder turned off.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <div className="page-subtitle">Get a daily reminder to log today's expenses</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        {!supported && (
          <div className="auth-error">
            Push notifications aren't supported in this browser. On iPhone, open this site in Safari,
            tap Share → "Add to Home Screen", then open it from the home screen icon and try again.
          </div>
        )}

        {supported && permission === 'denied' && (
          <div className="auth-error">
            Notifications are blocked for this site. Enable them in your browser/site settings, then reload.
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <div className="form-group">
          <label className="form-label">Remind me at</label>
          <select className="form-select" value={hour} onChange={(e) => setHour(Number(e.target.value))} disabled={enabled}>
            {HOURS.map((h) => (
              <option key={h} value={h}>{formatHour(h)} IST</option>
            ))}
          </select>
        </div>

        {enabled ? (
          <>
            <div className="auth-success" style={{ marginBottom: 14 }}>
              ✓ Daily reminders are on for this device.
            </div>
            <button className="btn btn-secondary btn-block" onClick={handleDisable} disabled={busy}>
              {busy ? 'Please wait...' : 'Turn off reminders'}
            </button>
          </>
        ) : (
          <button className="btn btn-block" onClick={handleEnable} disabled={busy || !supported}>
            {busy ? 'Please wait...' : 'Enable daily reminder'}
          </button>
        )}

        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 14 }}>
          This turns on for the device/browser you're using right now. If you use the app on
          another phone or browser, enable it there too.
        </p>
      </div>
    </div>
  )
}
