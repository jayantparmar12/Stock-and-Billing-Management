import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Billing from './pages/Billing'
import Products from './pages/Products'
import Customers from './pages/Customers'
import Categories from './pages/Categories'
import StockHistory from './pages/StockHistory'
import Payments from './pages/Payments'
import Refunds from './pages/Refunds'
import './styles/App.css'

const App = () => {
  return (
    <div className='u-container'>
      <Sidebar />

      <div className='main-area'>
        <Navbar />
        <div className='hero-section'>
          <Routes>
            <Route path='/' element={<Dashboard />} />
            <Route path='/products' element={<Products />} />
            <Route path='/billing' element={<Billing />} />
            <Route path='/customers' element={<Customers />} />
            <Route path='/categories' element={<Categories />} />
            <Route path='/stockhistory' element={<StockHistory />} />
            <Route path='/payments' element={<Payments />} />
            <Route path='/refunds' element={<Refunds />} />

          </Routes>
        </div>
      </div>
    </div>
  )
}

export default App