import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Shared CRUD + realtime hook. RLS on the Postgres side already scopes rows
// to what the signed-in user is allowed to see, so this stays a plain
// `select *` — no client-side user filtering needed.
export function useSupabaseTable(table, { orderBy = 'created_at', ascending = false, realtime = true } = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending })
    if (error) setError(error)
    else {
      setData(data)
      setError(null)
    }
    setLoading(false)
  }, [table, orderBy, ascending])

  useEffect(() => {
    refetch()
    if (!realtime) return
    const channel = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => refetch())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [table, refetch, realtime])

  const insert = useCallback(
    async (row) => {
      const { data, error } = await supabase.from(table).insert(row).select().single()
      if (error) throw error
      return data
    },
    [table]
  )

  const update = useCallback(
    async (id, patch) => {
      const { data, error } = await supabase.from(table).update(patch).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    [table]
  )

  const remove = useCallback(
    async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    },
    [table]
  )

  return { data, loading, error, refetch, insert, update, remove }
}
