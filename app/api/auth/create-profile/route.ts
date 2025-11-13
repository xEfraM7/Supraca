import { createClient } from "@/lib/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, email, fullName, role } = await request.json()

    // Use service role key to bypass RLS for profile creation
    const supabase = await createClient()

    const { error } = await supabase.from("profiles").insert({
      id: userId,
      email,
      full_name: fullName,
      role,
    })

    if (error) {
      console.error("[v0] Profile creation error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
  }
}
