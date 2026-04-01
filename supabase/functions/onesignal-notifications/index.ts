import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6"

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')!
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')!

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    const payload = await req.json()
    console.log("Webhook payload:", payload)

    const table = payload.table
    const action = payload.type
    const record = payload.record || payload.new
    const old_record = payload.old_record || payload.old

    if (!record) {
      return new Response("No record found", { status: 200 })
    }

    let targetUids: string[] = []
    let heading = "Family Task"
    let message = ""
    let group = ""

    if (table === "tasks" && action === "INSERT") {
      // Scenario A: Parent created task for child
      heading = "New Play Call! 📋"
      message = `A new task is waiting for you: ${record.title}`
      if (record.assigned_to) {
        targetUids = [record.assigned_to]
      }
      group = "tasks"
    } else if (table === "tasks" && action === "UPDATE" && record.status === "waiting_approval" && old_record?.status !== "waiting_approval") {
      // Scenario B: Child completed task
      heading = "Touchdown! 🏈"
    // Fetch child's name
      const { data: childProfile } = await supabase
         .from('profiles')
         .select('full_name')
         .eq('id', record.assigned_to)
         .single()
      
      const childName = childProfile?.full_name || "A child"
      message = `${childName} finished their task: ${record.title}`

      // Select parents of family
      const { data: parents } = await supabase
         .from('profiles')
         .select('id')
         .eq('family_id', record.family_id)
         .in('role', ['parent', 'admin_parent'])
      
      targetUids = parents?.map(p => p.id) || []
      group = "tasks"
    } else if (table === "rewards_redemptions" && action === "INSERT") {
      // Scenario C: Reward Purchase
      heading = "Reward Redeemed! 🔥"
      
      const { data: childProfile } = await supabase
         .from('profiles')
         .select('full_name')
         .eq('id', record.created_by)
         .single()

      const childName = childProfile?.full_name || "A child"
      message = `${childName} just bought a reward! Time to approve it.`
      
      // Select parents
      const { data: parents } = await supabase
         .from('profiles')
         .select('id')
         .eq('family_id', record.family_id)
         .in('role', ['parent', 'admin_parent'])
      
      targetUids = parents?.map((p: any) => p.id) || []
      group = "rewards"
    } else {
      return new Response("Not an actionable event", { status: 200 })
    }

    if (targetUids.length === 0) {
       console.log("No targets for event")
       return new Response("No targets", { status: 200 })
    }

    // Send to OneSignal natively using external_ids
    const onesignalRes = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        target_channel: "push",
        include_aliases: {
            external_id: targetUids
        },
        headings: { en: heading },
        contents: { en: message },
        small_icon: 'ic_stat_onesignal_default', // Add your 49ers logo as ic_stat_onesignal_default in Android res folders or pass a URL for large_icon
        android_group: group,
      }),
    })

    const osData = await onesignalRes.json()
    console.log("OneSignal response:", osData)

    return new Response(JSON.stringify(osData), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error: any) {
    console.error("Error processing webhook:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
