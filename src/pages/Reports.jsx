import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchExpenses } from '../lib/queries'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'

const COLORS = ['#5b5ff0', '#e0433b', '#16a34a', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

function monthsAgo(n) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

export default function Reports() {
  const { channel, members, profile } = useAuth()
  const [from, setFrom] = useState(monthsAgo(5))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
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

  const monthly = useMemo(() => {
    const map = {}
    rows.forEach(r => {
      const key = r.expense_date.slice(0, 7) // YYYY-MM
      if (!map[key]) map[key] = { month: key, income: 0, expense: 0 }
      map[key][r.type] += Number(r.amount)
    })
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({ ...m, savingsRate: m.income > 0 ? ((m.income - m.expense) / m.income) * 100 : 0, net: m.income - m.expense }))
  }, [rows])

  const categoryPie = useMemo(() => {
    const map = {}
    rows.filter(r => r.type === 'expense').forEach(r => {
      const name = r.categories?.name || 'Uncategorized'
      map[name] = (map[name] || 0) + Number(r.amount)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [rows])

  const subcategoryBar = useMemo(() => {
    const map = {}
    rows.filter(r => r.type === 'expense').forEach(r => {
      const name = r.subcategories?.name || (r.categories?.name ? `${r.categories.name} (general)` : 'Other')
      map[name] = (map[name] || 0) + Number(r.amount)
    })
    return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 10)
  }, [rows])

  const totals = useMemo(() => {
    const income = rows.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0)
    const expense = rows.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0
    return { income, expense, savingsRate, net: income - expense }
  }, [rows])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <div className="page-subtitle">Income, expenses & savings insights for {channel?.name}</div>
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
          <label>Member</label>
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
          <div className="stat-value income">₹{totals.income.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Expense</div>
          <div className="stat-value expense">₹{totals.expense.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Savings</div>
          <div className="stat-value" style={{ color: totals.net >= 0 ? 'var(--income)' : 'var(--expense)' }}>₹{totals.net.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg. Savings Rate</div>
          <div className="stat-value" style={{ color: totals.savingsRate >= 0 ? 'var(--income)' : 'var(--expense)' }}>{totals.savingsRate.toFixed(1)}%</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading reports...</div>
      ) : rows.length === 0 ? (
        <div className="empty-state">No data available for this range.</div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title">Income vs Expense Trend</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="var(--income)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expense" stroke="var(--expense)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-grid">
            <div className="card">
              <div className="section-title">Savings Rate Over Time</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                  <Line type="monotone" dataKey="savingsRate" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="section-title">Expense Share by Category</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={categoryPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categoryPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title">Monthly Net (Income − Expense)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                <Bar dataKey="net" radius={[6, 6, 0, 0]}>
                  {monthly.map((m, i) => <Cell key={i} fill={m.net >= 0 ? 'var(--income)' : 'var(--expense)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="section-title">Top Sub-Categories by Spend</div>
            <ResponsiveContainer width="100%" height={Math.max(260, subcategoryBar.length * 34)}>
              <BarChart data={subcategoryBar} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={140} />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                <Bar dataKey="amount" fill="var(--accent)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
