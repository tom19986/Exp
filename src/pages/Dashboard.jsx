import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchExpenses } from '../lib/queries'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'

const COLORS = ['#5b5ff0', '#e0433b', '#16a34a', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

function firstDayOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function Dashboard() {
  const { channel, profile, members } = useAuth()
  const [from, setFrom] = useState(firstDayOfMonth())
  const [to, setTo] = useState(today())
  const [userId, setUserId] = useState('all')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!channel) return
    setLoading(true)
    fetchExpenses(channel.id, { from, to, userId })
      .then(setRows)
      .finally(() => setLoading(false))
  }, [channel, from, to, userId])

  const stats = useMemo(() => {
    const income = rows.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0)
    const expense = rows.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)
    const balance = income - expense
    const savingsRate = income > 0 ? (balance / income) * 100 : 0
    return { income, expense, balance, savingsRate }
  }, [rows])

  const categoryPie = useMemo(() => {
    const map = {}
    rows.filter(r => r.type === 'expense').forEach(r => {
      const name = r.categories?.name || 'Uncategorized'
      map[name] = (map[name] || 0) + Number(r.amount)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [rows])

  const memberBar = useMemo(() => {
    const map = {}
    rows.forEach(r => {
      const name = r.profiles?.full_name || 'User'
      if (!map[name]) map[name] = { name, income: 0, expense: 0 }
      map[name][r.type] += Number(r.amount)
    })
    return Object.values(map)
  }, [rows])

  const recent = rows.slice(0, 6)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-subtitle">{channel?.name} · Overview of income, expenses and savings</div>
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
        <div className="filter-item" style={{ minWidth: 260 }}>
          <label>Viewing</label>
          <div className="pill-group">
            <button className={'pill' + (userId === 'all' ? ' active' : '')} onClick={() => setUserId('all')}>Overall</button>
            {members.map(m => (
              <button key={m.id} className={'pill' + (userId === m.id ? ' active' : '')} onClick={() => setUserId(m.id)}>
                {m.id === profile?.id ? 'Me' : (m.full_name || 'User')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value income">₹{stats.income.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Expense</div>
          <div className="stat-value expense">₹{stats.expense.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Balance</div>
          <div className="stat-value" style={{ color: stats.balance >= 0 ? 'var(--income)' : 'var(--expense)' }}>
            ₹{stats.balance.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Savings Rate</div>
          <div className="stat-value" style={{ color: stats.savingsRate >= 0 ? 'var(--income)' : 'var(--expense)' }}>
            {stats.savingsRate.toFixed(1)}%
          </div>
          <div className="stat-sub">of income saved</div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="section-title">Expense by Category</div>
          {categoryPie.length === 0 ? (
            <div className="empty-state">No expense data for this range.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="section-title">Income vs Expense by Member</div>
          {memberBar.length === 0 ? (
            <div className="empty-state">No data for this range.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={memberBar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                <Legend />
                <Bar dataKey="income" fill="var(--income)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" fill="var(--expense)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Type</th><th>Category</th><th>Sub Category</th><th>Member</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="empty-state">Loading...</td></tr>
            ) : recent.length === 0 ? (
              <tr><td colSpan={7} className="empty-state">No recent transactions</td></tr>
            ) : recent.map(r => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
