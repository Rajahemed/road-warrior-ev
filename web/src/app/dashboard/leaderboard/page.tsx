"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import axios from "axios"
import { Language, useTranslation } from "@/lib/i18n"

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<Language>("en")
  const t = useTranslation(lang)

  useEffect(() => {
    const saved = localStorage.getItem("rw-lang") as Language
    if (saved && ["en", "hi", "kn"].includes(saved)) {
      setLang(saved)
    }

    const fetchData = async () => {
      try {
        const lbRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}` + "/leaderboard/")
        if (lbRes.data.success) {
          setLeaderboardData(lbRes.data.data)
        }
      } catch (err) {
        console.error("Failed to load leaderboard data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="p-8 text-center text-slate-500">Loading leaderboard...</div>

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-6">
      <div className="p-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 items-start">
          <Card className="shadow-md border-slate-200">
            <CardHeader className="bg-slate-800 text-white rounded-t-xl">
              <CardTitle>{t("top_riders_title")}</CardTitle>
              <CardDescription className="text-slate-300">{t("top_riders_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {leaderboardData.map((user, idx) => (
                  <div key={user.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? "bg-yellow-100 text-yellow-700" : idx === 1 ? "bg-slate-200 text-slate-700" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}>
                        #{idx + 1}
                      </div>
                      <div className="flex flex-col">
                        <div className="font-medium text-slate-800">{user.full_name || t("anonymous_rider")}</div>
                        <div className="text-[10px] text-yellow-500 tracking-widest mt-0.5">
                          {user.points >= 100 ? "⭐⭐⭐⭐⭐" : user.points >= 50 ? "⭐⭐⭐⭐" : user.points >= 25 ? "⭐⭐⭐" : user.points > 10 ? "⭐⭐" : "⭐"}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-sm">
                      {user.points} {t("pts")}
                    </div>
                  </div>
                ))}
                {leaderboardData.length === 0 && (
                  <div className="p-8 text-center text-slate-500">{t("no_leaderboard_data")}</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-slate-200">
            <CardHeader className="bg-slate-100 border-b border-slate-200 rounded-t-xl">
              <CardTitle className="text-slate-800 text-lg">{t("referral_milestones_title")}</CardTitle>
              <CardDescription className="text-slate-500">{t("referral_milestones_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center text-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 mb-2 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">10</div>
                <h4 className="font-semibold text-slate-800 text-[13px] leading-tight">10 {t("referrals")}</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-tight">{t("reward_10_ref")}</p>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 mb-2 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">25</div>
                <h4 className="font-semibold text-slate-800 text-[13px] leading-tight">25 {t("referrals")}</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-tight">{t("reward_25_ref")}</p>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 mb-2 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold">50</div>
                <h4 className="font-semibold text-slate-800 text-[13px] leading-tight">50 {t("referrals")}</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-tight">{t("reward_50_ref")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
