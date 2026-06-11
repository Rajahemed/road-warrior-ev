"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Language, useTranslation } from "@/lib/i18n"
import { Settings, LogOut, Globe, HelpCircle, Phone } from "lucide-react"

export default function Header() {
  const router = useRouter()
  const [lang, setLang] = useState<Language>("en")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const t = useTranslation(lang)

  useEffect(() => {
    const saved = localStorage.getItem("rw-lang") as Language
    if (saved && ["en", "hi", "kn"].includes(saved)) {
      setLang(saved)
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLangChange = (newLang: Language) => {
    setLang(newLang)
    localStorage.setItem("rw-lang", newLang)
    window.location.reload()
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 
            className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 cursor-pointer"
            onClick={() => router.push("/")}
          >
            Road Warrior
          </h1>
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex space-x-4">
              <button onClick={() => router.push("/dashboard/rider")} className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">{t("nav_dashboard")}</button>
              <button onClick={() => router.push("/dashboard/score")} className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">{t("nav_my_score")}</button>
              <button onClick={() => router.push("/dashboard/leaderboard")} className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">{t("nav_leaderboard")}</button>
            </nav>
            
            {/* Settings Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">Settings</h3>
                  </div>
                  
                  <div className="py-2">
                    <div className="px-4 py-2 hover:bg-slate-50 flex flex-col space-y-2">
                      <div className="flex items-center text-sm text-slate-700">
                        <Globe className="w-4 h-4 mr-3 text-slate-400" />
                        Language
                      </div>
                      <select 
                        value={lang} 
                        onChange={(e) => handleLangChange(e.target.value as Language)} 
                        className="w-full p-1.5 rounded-md border border-slate-200 text-xs bg-white text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="en">English</option>
                        <option value="hi">हिंदी (Hindi)</option>
                        <option value="kn">ಕನ್ನಡ (Kannada)</option>
                      </select>
                    </div>

                    <button className="w-full px-4 py-3 flex items-center text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <HelpCircle className="w-4 h-4 mr-3 text-slate-400" />
                      Help & Feedback
                    </button>
                    
                    <button className="w-full px-4 py-3 flex items-center text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <Phone className="w-4 h-4 mr-3 text-slate-400" />
                      Contact Us
                    </button>
                  </div>

                  <div className="border-t border-slate-100 px-4 py-3 flex justify-between items-center bg-slate-50">
                    <div className="flex space-x-3 text-slate-400">
                      <a href="#" className="hover:text-blue-500 transition-colors">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                      </a>
                      <a href="#" className="hover:text-blue-600 transition-colors">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                      </a>
                      <a href="#" className="hover:text-pink-600 transition-colors">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      </a>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 py-1">
                    <button 
                      onClick={handleLogout}
                      className="w-full px-4 py-3 flex items-center text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      {t("nav_logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </header>
  )
}

