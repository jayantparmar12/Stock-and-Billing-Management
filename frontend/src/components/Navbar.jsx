import React from 'react'
import { Bell, User } from 'lucide-react'
import '../styles/Navbar.css'

const Navbar = () => {
  return (
    <nav>
      <div className='title'>
        <h1>Dashboard Overview</h1>
      </div>
      <div className='options'>
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