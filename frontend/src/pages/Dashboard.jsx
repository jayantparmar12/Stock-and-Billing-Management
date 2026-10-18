import React from 'react'
import '../styles/Dashboard.css'
import { PackageSearch, Users, Weight, HandCoins, LayersArrowDown } from 'lucide-react'

const Dashboard = () => {
  return (
    <div className='d-container'>
      <div>Overview Status</div>
      <div className='card-container'>
        <div className='card products'>
          <div className='title'>
            <PackageSearch />
            <h1>Total Products</h1>
          </div>
          <div>
            <h1>200</h1>
          </div>
        </div>
        <div className='card customers'>
          <div className='title'>
            <Users />
            <h1>Total Custoemrs</h1>
          </div>
          <div>
            <h1>200</h1>
          </div>
        </div>
        <div className='card sales'>
          <div className='title'>
            <Weight />
            <h1>Total Sales</h1>
          </div>
          <div>
            <h1>200</h1>
          </div>
        </div>
        <div className='card pending-payments'>
          <div className='title'>
            <HandCoins />
            <h1>Total Pending Payments</h1>
          </div>
          <div>
            <h1>200</h1>
          </div>
        </div>
        <div className='card low-stock-products'>
          <div className='title'>
            <LayersArrowDown />
            <h1>Low Stock Products</h1>
          </div>
          <div>
            <h1>200</h1>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard