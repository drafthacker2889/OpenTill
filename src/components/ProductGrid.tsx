import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

// 1. Define what a "Product" looks like
interface Product {
  id: string
  name: string
  image_url: string | null
}

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // 2. Fetch data when the component loads
  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
      
      if (error) {
        console.error('Error fetching products:', error)
      } else {
        setProducts(data || [])
      }
      setLoading(false)
    }

    fetchProducts()
  }, [])

  if (loading) return <div>Loading items...</div>

  return (
    <div className="product-grid">
      {/* 3. Map through the data to create buttons */}
      {products.map((product) => (
        <div key={product.id} className="product-card">
          <h3>{product.name}</h3>
          {/* We will add Price here later when we connect the Variants table */}
        </div>
      ))}
    </div>
  )
}