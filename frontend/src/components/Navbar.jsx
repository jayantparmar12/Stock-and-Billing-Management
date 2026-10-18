import React from 'react'
import { Bell, User, Menu, Search } from 'lucide-react'
import '../styles/Navbar.css'

const Navbar = () => {
  return (
    <nav>
      <div className='title'>
        <h1><Menu /></h1>
      </div>
      <div className='options'>
        <div className='search'>
          <Search />
          <input type="search" placeholder='Search products, customers...' name="" id="" />
        </div>
        <Bell />
        <div className='user'>
          <div><User /></div>
          <div>Jayant</div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar