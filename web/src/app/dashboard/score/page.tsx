"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { QRCodeSVG } from "qrcode.react"
import { Language, useTranslation } from "@/lib/i18n"

export default function ScorePage() {
  const [stats, setStats] = useState<any>(null)
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
        const token = localStorage.getItem("token")
        if (!token) {
          window.location.href = "/login"
          return
        }
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}` + "/referrals/my-stats", {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.data.has_completed_questionnaire) {
          window.location.href = "/questionnaire";
          return;
        }
        setStats(res.data)
      } catch (err: any) {
        console.error("Failed to load dashboard data")
        if (err.response?.status === 401) {
          window.location.href = "/login"
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="p-8 text-center text-slate-500">Loading your score...</div>
  if (!stats) return <div className="p-8 text-center text-red-500">Failed to load data</div>

  const referralUrl = `https://roadwarriorev.com/score?ref=${stats.code}`
  const shareText = `Check out my EV savings score on Road Warrior! Join using my referral code ${stats.code}: ${referralUrl}`

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-6">
      <div className="p-4 max-w-md mx-auto">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="text-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h1 className="text-2xl font-bold text-emerald-700 mb-1">{t("hello")}, {stats.name || "Rider"}!</h1>
            <p className="text-slate-500 text-sm">{t("dashboard_welcome")}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-emerald-600 text-white border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-4xl font-bold">{stats.total_points}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-emerald-100 font-medium">{t("total_earning_points")}</CardDescription>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-4xl font-bold text-slate-800">{stats.referral_count}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-500 font-medium">{t("successful_referrals")}</CardDescription>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg border-emerald-100">
            <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
              <CardTitle className="text-slate-800">{t("your_qr_code")}</CardTitle>
              <CardDescription>{t("qr_description")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6 pt-6">
              <div className="bg-white p-4 rounded-2xl shadow-inner border border-slate-100">
                <QRCodeSVG value={referralUrl} size={200} />
              </div>
              <div className="text-center font-mono font-bold text-2xl tracking-wider text-slate-800 bg-slate-100 py-2 px-6 rounded-lg">
                {stats.code}
              </div>

              <div className="text-center w-full">
                <p className="text-sm font-medium text-slate-500 mb-2">{t("direct_referral_link")}</p>
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-sm text-blue-600 break-all select-all flex items-center justify-center">
                  <a href={referralUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {referralUrl}
                  </a>
                </div>
              </div>
              
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full bg-[#25D366] hover:bg-[#1ebd5a] text-white font-semibold shadow-md py-6 rounded-xl">
                  {t("share_whatsapp")}
                </Button>
              </a>
            </CardContent>
          </Card>

          {stats.milestones?.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">{t("milestones_achieved")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {stats.milestones.map((m: string, i: number) => (
                    <li key={i} className="flex items-center space-x-3 bg-emerald-50 p-3 rounded-lg text-emerald-800 font-medium border border-emerald-100">
                      <span className="text-xl">🏆</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
