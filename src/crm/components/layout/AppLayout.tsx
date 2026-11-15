import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Fixed topbar */}
      <Topbar />

      {/* Main content area */}
      <main
        className="ml-[240px] mt-[64px] min-h-[calc(100vh-64px)]"
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
