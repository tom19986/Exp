import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

function randomJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [channel, setChannel] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(prof || null)

    if (prof?.channel_id) {
      const { data: ch } = await supabase.from('channels').select('*').eq('id', prof.channel_id).single()
      setChannel(ch || null)

      const { data: mem } = await supabase.from('profiles').select('*').eq('channel_id', prof.channel_id).order('created_at')
      setMembers(mem || [])
    } else {
      setChannel(null)
      setMembers([])
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) loadProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) loadProfile(session.user.id)
      else {
        setProfile(null)
        setChannel(null)
        setMembers([])
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [loadProfile])

  const refreshProfile = useCallback(() => {
    if (session?.user) return loadProfile(session.user.id)
  }, [session, loadProfile])

  const signUp = async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    if (error) throw error
    return data
  }

  const signIn = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const createChannel = async (name) => {
    const join_code = randomJoinCode()
    const { data: ch, error } = await supabase
      .from('channels')
      .insert({ name, join_code, admin_id: session.user.id })
      .select()
      .single()
    if (error) throw error

    const { error: profErr } = await supabase
      .from('profiles')
      .update({ channel_id: ch.id, role: 'admin' })
      .eq('id', session.user.id)
    if (profErr) throw profErr

    await refreshProfile()
    return ch
  }

  const joinChannel = async (joinCode) => {
     const { data: matches, error } = await supabase
       .rpc('get_channel_by_join_code', { code: joinCode.trim().toUpperCase() })
     if (error) throw error
     const ch = matches?.[0]
     if (!ch) throw new Error('Invalid join code')

    const { error: profErr } = await supabase
      .from('profiles')
      .update({ channel_id: ch.id, role: 'member' })
      .eq('id', session.user.id)
    if (profErr) throw profErr

    await refreshProfile()
    return ch
  }

  const value = {
    session,
    user: session?.user || null,
    profile,
    channel,
    members,
    loading,
    signUp,
    signIn,
    signOut,
    createChannel,
    joinChannel,
    refreshProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
