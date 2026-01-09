import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

interface Variant {
  id: string
  name: string
  price: number
  stock_quantity: number    // <--- NEW
  track_stock: boolean      // <--- NEW
}

interface Product {
  id: string
  name: string
  image_url: string | null
  variants: Variant[]
}

interface Props {
  onAddToCart: (item: any) => void
}

export default function ProductGrid({ onAddToCart }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Function to refresh data (we will use this later when stock changes)
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, variants(*)')
      .order('name')
    
    if (error) console.error('Error:', error)
    else setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  if (loading) return <div style={{ padding: '20px' }}>Loading menu...</div>

  return (
    <div className="product-grid">
      {products.map((product) => (
        <div key={product.id} className="product-card">
          
          {product.image_url && (
            <img 
              src={product.image_url} 
              alt={product.name} 
              style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }} 
            />
          )}

          <h3>{product.name}</h3>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
            {product.variants.map((variant) => {
              
              // LOGIC: Check if item is out of stock
              const isOutOfStock = variant.track_stock && variant.stock_quantity <= 0
              
              return (
                <button
                  key={variant.id}
                  disabled={isOutOfStock} // <--- DISABLE BUTTON IF NO STOCK
                  onClick={() => onAddToCart({
                    id: variant.id,
                    name: `${product.name} (${variant.name})`,
                    price: variant.price,
                    // Pass these through so we can check them in the cart later if needed
                    track_stock: variant.track_stock, 
                    stock_quantity: variant.stock_quantity
                  })}
                  style={{
                    flex: 1,
                    padding: '10px',
                    // Grey out background if out of stock
                    background: isOutOfStock ? '#ccc' : '#222', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    opacity: isOutOfStock ? 0.6 : 1
                  }}
                >
                  {variant.name} <br/> 
                  
                  {/* PRICE DISPLAY */}
                  <span style={{ opacity: 0.8, fontSize: '0.8em' }}>
                    ${(variant.price / 100).toFixed(2)}
                  </span>

                  {/* STOCK DISPLAY (Only if tracking is ON) */}
                  {variant.track_stock && (
                    <div style={{ fontSize: '0.7em', color: isOutOfStock ? 'red' : '#4caf50', marginTop: '2px' }}>
                      {isOutOfStock ? 'Out of Stock' : `${variant.stock_quantity} left`}
                    </div>
                  )}

                </button>
              )
            })}
          </div>

        </div>
      ))}
    </div>
  )
}