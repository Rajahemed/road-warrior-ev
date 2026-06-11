import React from "react"
import Header from "@/components/common/Header"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        {children}
      </main>
    </div>
  )
}
