import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

// 1. Define the shape of our Data
interface Variant {
  id: string
  name: string
  price: number
}

interface Product {
  id: string
  name: string
  image_url: string | null
  variants: Variant[] // Nested list of sizes/options
}

interface Props {
  onAddToCart: (item: any) => void
}

export default function ProductGrid({ onAddToCart }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 2. Fetch Products AND their nested Variants (The "Join" query)
    async function fetchData() {
      const { data, error } = await supabase
        .from('products')
        .select('*, variants(*)') // <--- This gets the sub-items automatically
        .order('name')
      
      if (error) {
        console.error('Error loading products:', error)
      } else {
        setProducts(data || [])
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return <div style={{ padding: '20px' }}>Loading menu...</div>

  return (
    <div className="product-grid">
      {products.map((product) => (
        <div key={product.id} className="product-card">
          
          {/* 3. Display Image (Only if one exists) */}
          {product.image_url && (
            <img 
              src={product.image_url} 
              alt={product.name} 
              style={{ 
                width: '100%', 
                height: '140px', 
                objectFit: 'cover', 
                borderRadius: '6px', 
                marginBottom: '10px' 
              }} 
            />
          )}

          <h3>{product.name}</h3>
          
          {/* 4. Display Buttons for each Variant (Small, Large, etc) */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
            {product.variants.length > 0 ? (
              product.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => onAddToCart({
                    id: variant.id,                         // Use the specific Variant ID
                    name: `${product.name} (${variant.name})`, // e.g. "Latte (Small)"
                    price: variant.price
                  })}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#222',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {variant.name} <br/> 
                  <span style={{ opacity: 0.8, fontSize: '0.8em' }}>
                    ${(variant.price / 100).toFixed(2)}
                  </span>
                </button>
              ))
            ) : (
              <p style={{ color: '#888', fontSize: '0.8rem' }}>No options available</p>
            )}
          </div>

        </div>
      ))}
    </div>
  )
}