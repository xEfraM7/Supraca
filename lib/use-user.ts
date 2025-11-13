"use client"

import { createClient } from "@/lib/client"
import type { Profile } from "@/lib/database"
import { useEffect, useState } from "react"

export function useUser() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setProfile(null)
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) throw error

        setProfile(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch user")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { profile, isLoading, error }
}
