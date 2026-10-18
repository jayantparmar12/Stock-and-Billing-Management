import React from 'react'
import { NavLink } from 'react-router-dom'
import '../styles/Sidebar.css'

const Sidebar = () => {
  return (
    <div className='sidebar-container'>
      <div className='sidebar-title'>
        <h1>StockFlow</h1>
        <p>Inventory Management</p>
      </div>
      <div>
        <ul className='links'>
          <li><NavLink to='/'>Dasbboard</NavLink></li>
          <li><NavLink to='/products'>Products</NavLink></li>
          <li><NavLink to='/categories'>Categories</NavLink></li>
          <li><NavLink to='/customers'>Customers</NavLink></li>
          <li><NavLink to='/billing'>Billing</NavLink></li>
          <li><NavLink to='/payments'>Payments</NavLink></li>
          <li><NavLink to='/refunds'>Refunds</NavLink></li>
          <li><NavLink to='/stockhistory'>Stock History</NavLink></li>
        </ul>
      </div>
      <div>
        <div className="admin">
          <h1>Admin User</h1>
          <p>Administrator</p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar