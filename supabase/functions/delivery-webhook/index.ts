// Follows Deno/Supabase Edge Functions structure
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const provider = req.headers.get('x-delivery-provider') || 'generic'

    // Normalize incoming order payload
    const orderData = {
      // source: provider, // Add this column if you edit your schema
      customer_id: null, // Delivery customers might not be in your CRM
      branch_id: payload.branch_id || 'default', // Default branch
      total_amount: Math.round(payload.total_amount * 100), // Convert to cents if incoming is dollars/float
      payment_method: `ONLINE_${provider.toUpperCase()}`,
      status: 'confirmed', // Assuming prepaid
      // items: payload.items || [], // Store raw items in a JSONB column if exists, OR use sell_items RPC below
      created_at: new Date().toISOString()
    }
    
    // Use the RPC to ensure items are handled correctly (inventory, etc)
    const rpcPayload = {
        branchId: orderData.branch_id,
        totalAmount: orderData.total_amount,
        paymentMethod: orderData.payment_method,
        items: (payload.items || []).map((i: any) => ({
            id: i.id || 'Unknown', // Variant ID needs to match your system
            name: i.name,
            price: Math.round(i.price * 100),
            quantity: i.quantity,
            modifiers: i.modifiers || []
        }))
    }

    // Insert into Supabase using the same logic as the POS
    // Note: If you don't have authentication on this webhook, be careful. 
    // Ideally use a shared secret in headers.
    const { data: rpcData, error: rpcError } = await supabase.rpc('sell_items', { order_payload: rpcPayload });

    if (rpcError) throw rpcError;

    // Optional: Create a kitchen ticket explicitly if sell_items doesn't do it automatically for online orders
    // But 'sell_items' triggers usually handle this.

    return new Response(JSON.stringify({ success: true, order_id: rpcData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
