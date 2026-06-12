"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axios from "axios"
export default function ScorePage() {
  const [phone, setPhone] = useState("")
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await axios.get(`http://localhost:8000/score/phone?q=${encodeURIComponent(phone)}`)
      setStats(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Could not find score for this number.")
      const detail = err.response?.data?.detail;
      const errorMessage = typeof detail === 'string' ? detail : (Array.isArray(detail) && detail.length > 0 ? detail[0]?.msg : "Could not find score for this number.");
      setError(errorMessage)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Check Your Score</CardTitle>
          <CardDescription>Enter your registered mobile number to see your referrals and points.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <Input 
              placeholder="+91 99999 99999" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              required 
            />
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? "Searching..." : "Check Score"}
            </Button>
          </form>
          {error && <div className="mt-4 text-red-500 text-sm text-center">{error}</div>}
          {stats && (
            <div className="mt-6 space-y-4">
              <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
                <div className="text-xl text-green-800 font-bold mb-2">Hello, {stats.name || "Rider"}!</div>
                <div className="text-sm text-green-600 font-semibold mb-1">Total Points</div>
                <div className="text-4xl font-bold text-green-700">{stats.total_points}</div>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Referrals</span>
                <span className="font-bold">{stats.referral_count}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Referral Code</span>
                <span className="font-mono font-bold">{stats.code}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
