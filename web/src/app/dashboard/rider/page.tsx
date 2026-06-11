"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Users, Zap, Shield, TrendingUp } from "lucide-react"
import axios from "axios"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [topReferrers, setTopReferrers] = useState<any[]>([])
  const [segmentFilter, setSegmentFilter] = useState("ALL")
  const [cityFilter, setCityFilter] = useState("ALL")
  const [activeTab, setActiveTab] = useState("overview")

  const downloadCSV = () => {
    if (!stats?.all_riders_tagged) return
    const filtered = stats.all_riders_tagged.filter((r: any) => 
      (segmentFilter === "ALL" || (r.segments && r.segments.includes(segmentFilter))) &&
      (cityFilter === "ALL" || r.city === cityFilter)
    )
    
    const headers = ["Name", "Phone", "City", "Vehicle Type", "Segments"]
    const rows = filtered.map((r: any) => [
      `"${r.name || ""}"`,
      `"${r.phone || ""}"`,
      `"${r.city || ""}"`,
      `"${r.vehicle_type || ""}"`,
      `"${(r.segments || []).join(", ")}"`
    ])
    
    const csvContent = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `riders_${segmentFilter.toLowerCase()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          window.location.href = "/login"
          return
        }
        const headers = { Authorization: `Bearer ${token}` }
        
        const [statsRes, referrersRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}` + "/dashboard/stats", { headers }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}` + "/leaderboard/top-referrers", { headers })
        ])
        
        setStats(statsRes.data)
        setTopReferrers(referrersRes.data.data || [])
      } catch (err: any) {
        console.error("Failed to load admin stats")
        if (err.response?.status === 401) {
          window.location.href = "/login"
        }
      } finally {
        setLoading(false)
      }
    }
    fetchAdminData()
  }, [])

  if (loading) return <div className="p-8 text-center text-slate-500">Loading your dashboard...</div>
  if (!stats) return <div className="p-8 text-center text-red-500">Failed to load data</div>

  const cityChartData = {
    labels: stats?.city_breakdown?.map((c: any) => c.city) || [],
    datasets: [
      {
        label: 'Riders',
        data: stats?.city_breakdown?.map((c: any) => c.count) || [],
        backgroundColor: [
          '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'
        ],
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Top Header Background */}
      <div className="bg-blue-600 -mx-6 -mt-6 p-8 pb-20">
        <h1 className="text-3xl font-bold text-white text-center">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex justify-center -mt-12 space-x-4 mb-8 px-4 overflow-x-auto">
        <button 
          onClick={() => setActiveTab("overview")}
          className={`flex flex-col items-center justify-center p-4 rounded-lg bg-white shadow-md w-32 h-24 border-b-4 transition-all ${activeTab === "overview" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600 hover:bg-slate-50"}`}
        >
          <PieChart className="w-6 h-6 mb-2" />
          <span className="text-sm font-medium">Overview</span>
        </button>

        <button 
          onClick={() => setActiveTab("top_riders")}
          className={`flex flex-col items-center justify-center p-4 rounded-lg bg-white shadow-md w-32 h-24 border-b-4 transition-all ${activeTab === "top_riders" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600 hover:bg-slate-50"}`}
        >
          <Users className="w-6 h-6 mb-2" />
          <span className="text-sm font-medium">Top Riders</span>
        </button>

        <button 
          onClick={() => setActiveTab("ev_leads")}
          className={`flex flex-col items-center justify-center p-4 rounded-lg bg-white shadow-md w-32 h-24 border-b-4 transition-all ${activeTab === "ev_leads" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600 hover:bg-slate-50"}`}
        >
          <Zap className="w-6 h-6 mb-2" />
          <span className="text-sm font-medium">EV Leads</span>
        </button>

        <button 
          onClick={() => setActiveTab("insurance")}
          className={`flex flex-col items-center justify-center p-4 rounded-lg bg-white shadow-md w-32 h-24 border-b-4 transition-all ${activeTab === "insurance" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600 hover:bg-slate-50"}`}
        >
          <Shield className="w-6 h-6 mb-2" />
          <span className="text-sm font-medium">Insurance</span>
        </button>

        <button 
          onClick={() => setActiveTab("city_data")}
          className={`flex flex-col items-center justify-center p-4 rounded-lg bg-white shadow-md w-32 h-24 border-b-4 transition-all ${activeTab === "city_data" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600 hover:bg-slate-50"}`}
        >
          <TrendingUp className="w-6 h-6 mb-2" />
          <span className="text-sm font-medium">City Data</span>
        </button>
      </div>

      <div className="space-y-6">
      {activeTab === "overview" && (
        <>
          {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-blue-100 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Total Riders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{stats.total_riders}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-emerald-100 bg-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Total EV Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{stats.ev_leads}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-orange-100 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Insurance Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{stats.insurance_leads}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-purple-100 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{stats.total_referrals}</div>
          </CardContent>
        </Card>
      </div>
      </>
      )}

      {activeTab === "city_data" && (
        <div className="grid grid-cols-1 gap-6">
          {/* City Breakdown */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>City Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {stats.city_breakdown.length > 0 ? (
              <div className="w-full h-80">
                <Bar data={cityChartData} options={barOptions} />
              </div>
            ) : (
              <p className="text-slate-500">No city data available yet.</p>
            )}
          </CardContent>
        </Card>
        </div>
      )}
        
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Breakdown */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Vehicle Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.vehicle_breakdown?.map((v: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium text-slate-700">{v.vehicle_type}</span>
                  <span className="bg-slate-100 px-3 py-1 rounded-full text-sm font-bold text-slate-600">{v.count}</span>
                </div>
              ))}
              {(!stats.vehicle_breakdown || stats.vehicle_breakdown.length === 0) && <p className="text-slate-500">No vehicle data available yet.</p>}
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {activeTab === "top_riders" && (
        <>
        {/* Top Referrers */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topReferrers.map((user: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                    <span className="font-medium text-slate-700">{user.full_name || "Unknown"}</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">{user.referral_count} referrals</span>
                </div>
              ))}
              {topReferrers.length === 0 && <p className="text-slate-500">No referrals yet.</p>}
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {activeTab === "ev_leads" && (
        <>
        {/* Hot Leads Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Hot EV Switch Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.hot_leads && stats.hot_leads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="p-3 text-sm font-medium text-slate-600">Rider Name</th>
                    <th className="p-3 text-sm font-medium text-slate-600">Phone</th>
                    <th className="p-3 text-sm font-medium text-slate-600">City</th>
                    <th className="p-3 text-sm font-medium text-slate-600">Current Vehicle</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.hot_leads.map((lead: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="p-3 text-sm font-medium text-slate-800">{lead.name}</td>
                      <td className="p-3 text-sm text-slate-600">{lead.phone}</td>
                      <td className="p-3 text-sm text-slate-600">{lead.city}</td>
                      <td className="p-3 text-sm text-slate-600">
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">{lead.vehicle_type}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500">No hot EV leads found yet.</p>
          )}
        </CardContent>
      </Card>
      </>
      )}

      {activeTab === "insurance" && (
      <>
      {/* Insurance Leads Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Insurance Partner Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.insurance_leads_list && stats.insurance_leads_list.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="p-3 text-sm font-medium text-slate-600">Rider Name</th>
                    <th className="p-3 text-sm font-medium text-slate-600">Phone</th>
                    <th className="p-3 text-sm font-medium text-slate-600">City</th>
                    <th className="p-3 text-sm font-medium text-slate-600">Current Vehicle</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.insurance_leads_list.map((lead: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="p-3 text-sm font-medium text-slate-800">{lead.name}</td>
                      <td className="p-3 text-sm text-slate-600">{lead.phone}</td>
                      <td className="p-3 text-sm text-slate-600">{lead.city}</td>
                      <td className="p-3 text-sm text-slate-600">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{lead.vehicle_type}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500">No insurance leads found yet.</p>
          )}
        </CardContent>
      </Card>
      </>
      )}

      {activeTab === "overview" && (
      <>
      {/* All Riders with Segment Tags */}
      <Card className="shadow-sm" id="all-riders-table">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle>All Riders (Segment Tagging)</CardTitle>
            {cityFilter !== "ALL" && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center cursor-pointer hover:bg-blue-200" onClick={() => setCityFilter("ALL")}>
                City: {cityFilter} <span className="ml-2">×</span>
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <select 
              className="border border-slate-200 rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
            >
              <option value="ALL">All Segments</option>
              <option value="PERSONAL_INSURANCE_LEAD">Personal Insurance Lead</option>
              <option value="BIKE_INSURANCE_LEAD">Bike Insurance Lead</option>
              <option value="EV_SALE_LEAD">EV Sale Lead</option>
              <option value="EV_RENTAL_LEAD">EV Rental Lead</option>
              <option value="RETROFIT_LEAD">Retrofit Lead</option>
              <option value="PRODUCT_LEAD">Product Lead</option>
            </select>
            <button 
              onClick={downloadCSV}
              className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              Export CSV
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {stats.all_riders_tagged && stats.all_riders_tagged.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="p-3 text-sm font-medium text-slate-600">Rider Name</th>
                    <th className="p-3 text-sm font-medium text-slate-600">Phone</th>
                    <th className="p-3 text-sm font-medium text-slate-600">City</th>
                    <th className="p-3 text-sm font-medium text-slate-600">Segments</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.all_riders_tagged
                    .filter((rider: any) => segmentFilter === "ALL" || (rider.segments && rider.segments.includes(segmentFilter)))
                    .map((rider: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="p-3 text-sm font-medium text-slate-800">{rider.name}</td>
                      <td className="p-3 text-sm text-slate-600">{rider.phone}</td>
                      <td className="p-3 text-sm text-slate-600">{rider.city}</td>
                      <td className="p-3 text-sm flex flex-wrap gap-1">
                        {Array.from(new Set(rider.segments || [])).map((seg: any) => (
                          <span key={seg} className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${
                            seg === "EV_SALE_LEAD" ? "bg-orange-100 text-orange-700" :
                            seg === "EV_RENTAL_LEAD" ? "bg-amber-100 text-amber-700" :
                            seg === "RETROFIT_LEAD" ? "bg-purple-100 text-purple-700" : 
                            seg === "PERSONAL_INSURANCE_LEAD" ? "bg-blue-100 text-blue-700" :
                            seg === "BIKE_INSURANCE_LEAD" ? "bg-cyan-100 text-cyan-700" :
                            seg === "PRODUCT_LEAD" ? "bg-pink-100 text-pink-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {seg.replace(/_/g, " ")}
                          </span>
                        ))}
                        {(!rider.segments || rider.segments.length === 0) && <span className="text-slate-400 italic text-xs">No tags</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500">No riders found yet.</p>
          )}
        </CardContent>
      </Card>
      </>
      )}
      </div>
    </div>
  )
}
