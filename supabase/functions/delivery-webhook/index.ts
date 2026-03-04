// Follows Deno/Supabase Edge Functions structure
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const payload = await req.json()
    const provider = req.headers.get('x-delivery-provider') || 'generic'

    // Normalize incoming order payload
    const orderData = {
      source: provider, // 'ubereats', 'deliveroo'
      external_id: payload.id || payload.order_id,
      customer_name: payload.customer?.name || 'Delivery Customer',
      total_amount: payload.total_amount || 0,
      status: 'pending', // or 'received'
      items: payload.items || [], // JSONB column for items
      delivery_address: payload.delivery_address,
      created_at: new Date().toISOString()
    }

    // Insert into Supabase 'orders' table
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()

    if (error) throw error

    return new Response(JSON.stringify({ success: true, order: data[0] }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })
  }
})
