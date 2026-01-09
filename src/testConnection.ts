import { supabase } from './supabaseClient'

async function testConnection() {
  console.log("Attempting to connect...")
  
  // Try to grab the products
  const { data, error } = await supabase
    .from('products')
    .select('*')

  if (error) {
    console.error("❌ Connection Failed:", error.message)
  } else {
    console.log("✅ Connection Successful!")
    console.log("Found Products:", data)
  }
}

testConnection()