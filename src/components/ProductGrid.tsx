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
  variants: Variant[]
}

interface Props {
  onAddToCart: (item: any) => void
}

export default function ProductGrid({ onAddToCart }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  
  const [selectedCategory, setSelectedCategory] = useState("All") 
  const [searchQuery, setSearchQuery] = useState("") 

  // --- NEW: COLOR MAP ---
  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'coffee': return '#795548'   // Brown
      case 'snacks': return '#ff9800'   // Orange
      case 'drinks': return '#03a9f4'   // Blue
      case 'alcohol': return '#9c27b0'  // Purple
      case 'food': return '#4caf50'     // Green
      default: return '#9e9e9e'         // Grey
    }
  }

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

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category || "Uncategorized")))]

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (loading) return <div style={{ padding: '20px' }}>Loading menu...</div>

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* --- TOP BAR --- */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text"
          placeholder="🔍 Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '15px', fontSize: '1.1rem',
            border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)', boxSizing: 'border-box'
          }}
        />

        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '10px 25px',
                borderRadius: '30px',
                border: 'none',
                cursor: 'pointer',
                // Make the active tab match the category color!
                background: selectedCategory === cat ? (cat === 'All' ? 'black' : getCategoryColor(cat)) : 'white',
                color: selectedCategory === cat ? 'white' : 'black',
                fontWeight: 'bold',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                whiteSpace: 'nowrap',
                fontSize: '0.9rem',
                transition: '0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* --- UNIFORM GRID WITH COLOR CODING --- */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', 
        gap: '15px',
        alignContent: 'start'
      }}>
        {filteredProducts.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic', gridColumn: '1/-1' }}>No products found.</p>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} style={{ 
              background: 'white', 
              borderRadius: '12px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              overflow: 'hidden', // Keeps the color bar inside the rounded corners
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              height: '100%',
              minHeight: '150px',
              border: '1px solid #eee'
            }}>
              
              {/* --- COLOR HEADER --- */}
              <div style={{ 
                height: '8px', 
                width: '100%', 
                backgroundColor: getCategoryColor(product.category) 
              }}></div>

              <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                {/* Product Name */}
                <h3 style={{ 
                  margin: '0 0 5px 0', 
                  fontSize: '1.2rem', 
                  fontWeight: '800', 
                  color: '#222',
                  textAlign: 'left'
                }}>
                  {product.name}
                </h3>

                {/* Category Label (Small helper text) */}
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: getCategoryColor(product.category), 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase', 
                  marginBottom: '15px',
                  opacity: 0.8 
                }}>
                  {product.category}
                </div>
                
                {/* Spacer to push buttons to bottom */}
                <div style={{ flex: 1 }}></div>

                {/* Variant Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                          width: '100%',
                          padding: '12px',
                          // Subtle tint matching the category color for the buttons
                          background: isOutOfStock ? '#f5f5f5' : '#fff',
                          color: isOutOfStock ? '#aaa' : '#333',
                          border: isOutOfStock ? '1px solid #eee' : `1px solid ${getCategoryColor(product.category)}40`, // 40 = transparent hex
                          borderRadius: '8px',
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: '0.1s',
                          boxShadow: isOutOfStock ? 'none' : '0 2px 5px rgba(0,0,0,0.05)'
                        }}
                      >
                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                          {variant.name === 'Standard' ? 'Add' : variant.name}
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                          ${(variant.price / 100).toFixed(2)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  )
}