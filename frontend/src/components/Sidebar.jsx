import React from 'react'
import { NavLink } from 'react-router-dom'
import '../styles/Slider.css'

const Sidebar = () => {
  return (
    <div className='slider-container'>
      <h1>Title</h1>
      <div>
        <ul className='links'>
          <li><NavLink to='/'>Dasbboard</NavLink></li>
          <li><NavLink to='/products'>Products</NavLink></li>
          <li><NavLink to='/billing'>Bills & Invoices</NavLink></li>
          <li><NavLink to='/customers'>Customers</NavLink></li>
          <li><NavLink to='/categories'>Categories</NavLink></li>
          <li><NavLink to='/stockhistory'>Stock History</NavLink></li>
        </ul>
      </div>
    </div>
  )
}

export default Sidebar