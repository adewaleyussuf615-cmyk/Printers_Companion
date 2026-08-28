import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

type Profile = {
  role: string | null
  whatsapp_verified: boolean
}

type ProtectedRouteProps = {
  allowedRoles?: string[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadProfile = async (currentSession: Session | null) => {
      if (!currentSession) {
        if (mounted) {
          setSession(null)
          setProfile(null)
          setLoading(false)
        }
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role, whatsapp_verified')
        .eq('id', currentSession.user.id)
        .single()

      if (!mounted) return
      setSession(currentSession)
      setProfile(error ? null : data)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }: any) => loadProfile(data.session))

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: any, currentSession: Session | null) => {
      setLoading(true)
      loadProfile(currentSession)
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading...</div>
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!profile?.whatsapp_verified) {
    return <Navigate to="/verify-whatsapp" state={{ from: location }} replace />
  }

  if (allowedRoles && (!profile.role || !allowedRoles.includes(profile.role))) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
