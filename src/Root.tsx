import ProductGrid from './components/ProductGrid'
import CartSidebar from './components/CartSidebar'
import './App.css'

function App() {
  return (
    <div className="app-container">
      {/* LEFT SIDE: The Menu */}
      <div className="main-section">
        <ProductGrid />
      </div>

      {/* RIGHT SIDE: The Receipt */}
      <div className="sidebar-section">
        <CartSidebar />
      </div>
    </div>
  )
}

export default App