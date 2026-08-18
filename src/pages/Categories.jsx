import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchCategories, createCategory, deleteCategory, createSubcategory, deleteSubcategory } from '../lib/queries'

export default function Categories() {
  const { channel, profile } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('expense')
  const [subInputs, setSubInputs] = useState({}) // categoryId -> text
  const [error, setError] = useState('')

  const load = () => {
    if (!channel) return
    setLoading(true)
    fetchCategories(channel.id).then(setCategories).finally(() => setLoading(false))
  }

  useEffect(load, [channel])

  const handleAddCategory = async (e) => {
    e.preventDefault()
    setError('')
    if (!newName.trim()) return
    try {
      await createCategory(channel.id, profile.id, newName.trim(), newType)
      setNewName('')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category and all its sub-categories?')) return
    await deleteCategory(id)
    load()
  }

  const handleAddSub = async (categoryId) => {
    const name = (subInputs[categoryId] || '').trim()
    if (!name) return
    await createSubcategory(channel.id, categoryId, name)
    setSubInputs(prev => ({ ...prev, [categoryId]: '' }))
    load()
  }

  const handleDeleteSub = async (id) => {
    await deleteSubcategory(id)
    load()
  }

  const income = categories.filter(c => c.type === 'income')
  const expense = categories.filter(c => c.type === 'expense')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <div className="page-subtitle">Create custom categories and sub-categories, e.g. "Bills" → Gas, Recharge, Electricity</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <div className="section-title">Add a new category</div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label className="form-label">Category Name</label>
            <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Outside Food, Bills, Sent To" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Type</label>
            <select className="form-select" value={newType} onChange={e => setNewType(e.target.value)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <button className="btn" type="submit">Add Category</button>
        </form>
      </div>

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : (
        <>
          <div className="section-title">Expense Categories</div>
          <div className="category-grid" style={{ marginBottom: 28 }}>
            {expense.length === 0 && <div className="empty-state">No expense categories yet.</div>}
            {expense.map(cat => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                subInputs={subInputs}
                setSubInputs={setSubInputs}
                onAddSub={handleAddSub}
                onDeleteSub={handleDeleteSub}
                onDeleteCategory={handleDeleteCategory}
              />
            ))}
          </div>

          <div className="section-title">Income Categories</div>
          <div className="category-grid">
            {income.length === 0 && <div className="empty-state">No income categories yet.</div>}
            {income.map(cat => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                subInputs={subInputs}
                setSubInputs={setSubInputs}
                onAddSub={handleAddSub}
                onDeleteSub={handleDeleteSub}
                onDeleteCategory={handleDeleteCategory}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function CategoryCard({ cat, subInputs, setSubInputs, onAddSub, onDeleteSub, onDeleteCategory }) {
  return (
    <div className="category-card">
      <div className="category-card-header">
        <div className="category-name">{cat.name}</div>
        <button className="icon-btn" onClick={() => onDeleteCategory(cat.id)} title="Delete category">🗑️</button>
      </div>

      <div className="sub-list">
        {cat.subcategories?.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No sub-categories</span>}
        {cat.subcategories?.map(s => (
          <span key={s.id} className="sub-chip">
            {s.name}
            <button onClick={() => onDeleteSub(s.id)} title="Remove">×</button>
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        <input
          className="form-input"
          style={{ padding: '7px 10px', fontSize: 13 }}
          placeholder="e.g. Gas, Recharge"
          value={subInputs[cat.id] || ''}
          onChange={e => setSubInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddSub(cat.id) } }}
        />
        <button className="btn btn-secondary btn-sm" type="button" onClick={() => onAddSub(cat.id)}>Add</button>
      </div>
    </div>
  )
}
