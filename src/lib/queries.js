import { supabase } from '../supabaseClient'

export async function fetchCategories(channelId) {
  const { data, error } = await supabase
    .from('categories')
    .select('*, subcategories(*)')
    .eq('channel_id', channelId)
    .order('created_at')
  if (error) throw error
  return data || []
}

export async function createCategory(channelId, userId, name, type) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ channel_id: channelId, created_by: userId, name, type })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function createSubcategory(channelId, categoryId, name) {
  const { data, error } = await supabase
    .from('subcategories')
    .insert({ channel_id: channelId, category_id: categoryId, name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSubcategory(id) {
  const { error } = await supabase.from('subcategories').delete().eq('id', id)
  if (error) throw error
}

export async function fetchExpenses(channelId, filters = {}) {
  let query = supabase
    .from('expenses')
    .select('*, categories(name,type), subcategories(name), profiles(full_name)')
    .eq('channel_id', channelId)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters.from) query = query.gte('expense_date', filters.from)
  if (filters.to) query = query.lte('expense_date', filters.to)
  if (filters.type && filters.type !== 'all') query = query.eq('type', filters.type)
  if (filters.userId && filters.userId !== 'all') query = query.eq('user_id', filters.userId)
  if (filters.categoryId && filters.categoryId !== 'all') query = query.eq('category_id', filters.categoryId)
  if (filters.subcategoryId && filters.subcategoryId !== 'all') query = query.eq('subcategory_id', filters.subcategoryId)

  const { data, error } = await query
  if (error) throw error

  let rows = data || []
  if (filters.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter(r => (r.description || '').toLowerCase().includes(s))
  }
  return rows
}

export async function createExpense(payload) {
  const { data, error } = await supabase.from('expenses').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateExpense(id, payload) {
  const { data, error } = await supabase.from('expenses').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteExpense(id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}
