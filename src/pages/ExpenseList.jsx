import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchCategories, fetchExpenses, deleteExpense } from '../lib/queries'

export default function ExpenseList() {
  const { channel, profile, members } = useAuth()
  const [categories, setCategories] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [type, setType] = useState('all')
  const [userId, setUserId] = useState('all')
  const [categoryId, setCategoryId] = useState('all')
  const [subcategoryId, setSubcategoryId] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (channel) fetchCategories(channel.id).then(setCategories)
  }, [channel])

  const load = () => {
    if (!channel) return
    setLoading(true)
    fetchExpenses(channel.id, { from, to, type, userId, categoryId, subcategoryId, search })
      .then(setRows)
      .finally(() => setLoading(false))
  }

  useEffect(load, [channel, from, to, type, userId, categoryId, subcategoryId])

  const filteredForType = useMemo(() => categories.filter(c => type === 'all' || c.type === type), [categories, type])
  const selectedCategory = useMemo(() => categories.find(c => c.id === categoryId), [categories, categoryId])
  const subOptions = selectedCategory?.subcategories || []

  const totals = useMemo(() => {
    const income = rows.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0)
    const expense = rows.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)
    return { income, expense, net: income - expense }
  }, [rows])

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return
    await deleteExpense(id)
    load()
  }

  const searchedRows = useMemo(() => {
    if (!search) return rows
    const s = search.toLowerCase()
    return rows.filter(r => (r.description || '').toLowerCase().includes(s))
  }, [rows, search])

  const resetFilters = () => {
    setFrom(''); setTo(''); setType('all'); setUserId('all'); setCategoryId('all'); setSubcategoryId('all'); setSearch('')
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <div className="page-subtitle">All transactions in {channel?.name}</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-item">
          <label>From</label>
          <input type="date" className="form-input" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="filter-item">
          <label>To</label>
          <input type="date" className="form-input" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <div className="filter-item">
          <label>Type</label>
          <select className="form-select" value={type} onChange={e => { setType(e.target.value); setCategoryId('all'); setSubcategoryId('all') }}>
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div className="filter-item">
          <label>Member</label>
          <select className="form-select" value={userId} onChange={e => setUserId(e.target.value)}>
            <option value="all">Everyone</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.id === profile?.id ? 'Me' : (m.full_name || 'User')}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <label>Category</label>
          <select className="form-select" value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubcategoryId('all') }}>
            <option value="all">All</option>
            {filteredForType.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <label>Sub Category</label>
          <select className="form-select" value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)} disabled={subOptions.length === 0}>
            <option value="all">All</option>
            {subOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="filter-item" style={{ minWidth: 180 }}>
          <label>Search description</label>
          <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
        </div>
        <button className="btn btn-secondary btn-sm" type="button" onClick={resetFilters}>Reset</button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">Filtered Income</div>
          <div className="stat-value income">₹{totals.income.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Filtered Expense</div>
          <div className="stat-value expense">₹{totals.expense.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net</div>
          <div className="stat-value" style={{ color: totals.net >= 0 ? 'var(--income)' : 'var(--expense)' }}>₹{totals.net.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Type</th><th>Category</th><th>Sub Category</th><th>Member</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="empty-state">Loading...</td></tr>
            ) : searchedRows.length === 0 ? (
              <tr><td colSpan={8} className="empty-state">No transactions match these filters.</td></tr>
            ) : searchedRows.map(r => (
              <tr key={r.id}>
                <td data-label="Date">{r.expense_date}</td>
                <td data-label="Type"><span className={'badge ' + r.type}>{r.type}</span></td>
                <td data-label="Category">{r.categories?.name || '-'}</td>
                <td data-label="Sub Category">{r.subcategories?.name || '-'}</td>
                <td data-label="Member">{r.profiles?.full_name || '-'}</td>
                <td data-label="Description">{r.description || '-'}</td>
                <td data-label="Amount" style={{ textAlign: 'right' }} className={'amount ' + r.type}>
                  {r.type === 'income' ? '+' : '-'}₹{Number(r.amount).toLocaleString('en-IN')}
                </td>
                <td data-label="">
                  {r.user_id === profile?.id && (
                    <button className="icon-btn" onClick={() => handleDelete(r.id)} title="Delete">🗑️</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
