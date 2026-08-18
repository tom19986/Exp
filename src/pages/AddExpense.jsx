import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchCategories, createExpense } from '../lib/queries'

export default function AddExpense() {
  const { channel, profile } = useAuth()
  const navigate = useNavigate()

  const [type, setType] = useState('expense')
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (channel) fetchCategories(channel.id).then(setCategories)
  }, [channel])

  const filteredCategories = useMemo(() => categories.filter(c => c.type === type), [categories, type])
  const selectedCategory = useMemo(() => categories.find(c => c.id === categoryId), [categories, categoryId])
  const subOptions = selectedCategory?.subcategories || []

  useEffect(() => {
    setCategoryId('')
    setSubcategoryId('')
  }, [type])

  useEffect(() => {
    setSubcategoryId('')
  }, [categoryId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!categoryId) { setError('Please select a category'); return }
    setBusy(true)
    try {
      await createExpense({
        channel_id: channel.id,
        user_id: profile.id,
        category_id: categoryId,
        subcategory_id: subcategoryId || null,
        type,
        amount: parseFloat(amount),
        description,
        expense_date: date
      })
      setSuccess('Saved successfully!')
      setAmount('')
      setDescription('')
      setSubcategoryId('')
      setTimeout(() => setSuccess(''), 2500)
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
          <h1 className="page-title">Add Transaction</h1>
          <div className="page-subtitle">Log an income or expense entry to your channel</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        {filteredCategories.length === 0 && (
          <div className="auth-error">
            No {type} categories yet. Go to <b>Categories</b> to create one (e.g. "Bills" with subcategories like Gas, Recharge, Electricity) before adding a transaction.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="type-toggle">
            <button type="button" className={'income' + (type === 'income' ? ' active' : '')} onClick={() => setType('income')}>💰 Income</button>
            <button type="button" className={'expense' + (type === 'expense' ? ' active' : '')} onClick={() => setType('expense')}>💸 Expense</button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                <option value="">Select category</option>
                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sub Category {subOptions.length === 0 && '(none for this category)'}</label>
              <select className="form-select" value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)} disabled={subOptions.length === 0}>
                <option value="">{subOptions.length ? 'Select sub category' : '—'}</option>
                {subOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input className="form-input" type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Electricity bill for August" />
          </div>

          <button className="btn btn-block" type="submit" disabled={busy}>
            {busy ? 'Saving...' : `Save ${type === 'income' ? 'Income' : 'Expense'}`}
          </button>
        </form>
      </div>
    </div>
  )
}
