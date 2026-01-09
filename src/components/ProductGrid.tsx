import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

interface Product {
  id: string
  name: string
  image_url: string | null
}

// Accept the function as a "Prop"
interface Props {
  onAddToCart: (product: Product) => void
}

export default function ProductGrid({ onAddToCart }: Props) {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    supabase.from('products').select('*').then(({ data }) => {
      setProducts(data || [])
    })
  }, [])

  return (
    <div className="product-grid">
      {products.map((product) => (
        <div 
          key={product.id} 
          className="product-card"
          onClick={() => onAddToCart(product)} // <--- THE MAGIC CLICK EVENT
        >
          <h3>{product.name}</h3>
          <p>$10.00</p>
        </div>
      ))}
    </div>
  )
}