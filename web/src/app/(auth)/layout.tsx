import React from "react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Subtle Light Animated Mesh Gradient Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-100/50 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-50/50 blur-[100px] animate-pulse" style={{ animationDelay: "2s" }}></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center transform transition-all duration-700 hover:scale-105">
          <h2 className="mt-6 text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-700 drop-shadow-sm">
            Road Warrior
          </h2>
          <p className="mt-3 text-sm text-slate-500 font-medium tracking-wide">
            India's premier EV gig worker platform
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:border-white/60">
          {children}
        </div>
      </div>
    </div>
  )
}
