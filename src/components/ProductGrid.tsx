import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

interface Variant {
  id: string
  name: string
  price: number
  stock_quantity: number
  track_stock: boolean
}

interface Product {
  id: string
  name: string
  category: string 
  image_url: string | null
  variants: Variant[]
}

interface Props {
  onAddToCart: (item: any) => void
}

export default function ProductGrid({ onAddToCart }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  
  // --- STATE ---
  const [selectedCategory, setSelectedCategory] = useState("All") 
  const [searchQuery, setSearchQuery] = useState("") // <--- NEW: Search State

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

  // 1. Get unique categories
  const categories = ["All", ...Array.from(new Set(products.map(p => p.category || "Uncategorized")))]

  // 2. FILTER LOGIC (Updated to check Category AND Search)
  const filteredProducts = products.filter(p => {
    // Check Category
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory
    
    // Check Search Text
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())

    // Return true only if BOTH match
    return matchesCategory && matchesSearch
  })

  if (loading) return <div style={{ padding: '20px' }}>Loading menu...</div>

  return (
    <div style={{ padding: '10px' }}>
      
      {/* --- TOP BAR: SEARCH & TABS --- */}
      <div style={{ marginBottom: '20px' }}>
        
        {/* NEW: SEARCH INPUT */}
        <input 
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '15px',
            boxSizing: 'border-box' // Ensures padding doesn't break layout
          }}
        />

        {/* CATEGORY TABS */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '10px 20px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                background: selectedCategory === cat ? 'black' : '#e0e0e0',
                color: selectedCategory === cat ? 'white' : 'black',
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* --- GRID --- */}
      <div className="product-grid">
        {filteredProducts.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic' }}>No products found.</p>
        ) : (
          filteredProducts.map((product) => (
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
                  const isOutOfStock = variant.track_stock && variant.stock_quantity <= 0
                  return (
                    <button
                      key={variant.id}
                      disabled={isOutOfStock}
                      onClick={() => onAddToCart({
                        id: variant.id,
                        name: `${product.name} (${variant.name})`,
                        price: variant.price,
                        track_stock: variant.track_stock, 
                        stock_quantity: variant.stock_quantity
                      })}
                      style={{
                        flex: 1,
                        padding: '10px',
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
                      <span style={{ opacity: 0.8, fontSize: '0.8em' }}>
                        ${(variant.price / 100).toFixed(2)}
                      </span>
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
          ))
        )}
      </div>
    </div>
  )
}