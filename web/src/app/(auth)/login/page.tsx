"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import axios from "axios"
import { Language, useTranslation } from "@/lib/i18n"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"
export default function LoginPage() {
  const router = useRouter()
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [lang, setLang] = useState<Language>("en")
  const t = useTranslation(lang)
  useEffect(() => {
    const saved = localStorage.getItem("rw-lang") as Language
    if (saved && ["en", "hi", "kn"].includes(saved)) {
      setLang(saved)
    }
  }, [])
  const handleLangChange = (newLang: Language) => {
    setLang(newLang)
    localStorage.setItem("rw-lang", newLang)
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")
  const getErrorMessage = (err: any, defaultMsg: string) => {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) return detail[0]?.msg;
    return defaultMsg;
  }
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password")
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])
  
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const validatePhone = (phoneStr: string) => {
    return /^[6-9]\d{9}$/.test(phoneStr)
  }
  const getRecaptchaToken = async (action: string) => {
    if (!executeRecaptcha) return "dummy_token"
    return await executeRecaptcha(action)
  }
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (honeypot) return // Bot detected
    
    if (!validatePhone(phone)) {
      setError("Please enter a valid 10-digit Indian mobile number.")
      return
    }
    setLoading(true)
    setError("")
    setMsg("")
    try {
      const token = await getRecaptchaToken("login_password")
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}` + "/auth/login", { phone, password, recaptcha_token: token })
      localStorage.setItem("token", res.data.access_token)
      localStorage.setItem("user", JSON.stringify(res.data.user))
      
      if (res.data.user?.role === "admin") {
        router.push("/dashboard/admin")
      } else {
        if (res.data.user?.has_completed_questionnaire) {
          router.push("/dashboard/score")
        } else {
          router.push("/questionnaire")
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Check your password.")
      setError(getErrorMessage(err, "Login failed. Check your password."))
    } finally {
      setLoading(false)
    }
  }
  const handleSendOTP = async () => {
    if (honeypot) return
    
    if (!validatePhone(phone)) {
      setError("Please enter a valid 10-digit Indian mobile number.")
      return
    }
    setLoading(true)
    setError("")
    setMsg("")
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}` + "/auth/send-otp", { phone })
      setOtpSent(true)
      setResendTimer(30)
      setMsg("OTP sent successfully to your mobile number.")
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send OTP.")
      setError(getErrorMessage(err, "Failed to send OTP."))
    } finally {
      setLoading(false)
    }
  }
  const handleVerifyOTP = async () => {
    if (honeypot) return
    if (!otp) {
      setError("Please enter the OTP.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const token = await getRecaptchaToken("verify_otp")
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}` + "/auth/verify-otp", { phone, otp, recaptcha_token: token })
      localStorage.setItem("token", res.data.access_token)
      localStorage.setItem("user", JSON.stringify(res.data.user))
      
      if (res.data.user?.role === "admin") {
        router.push("/dashboard/admin")
      } else {
        if (res.data.user?.has_completed_questionnaire) {
          router.push("/dashboard/score")
        } else {
          router.push("/questionnaire")
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid OTP.")
      setError(getErrorMessage(err, "Invalid OTP."))
    } finally {
      setLoading(false)
    }
  }
  const handleForgotPassword = async () => {
    if (!phone) {
      setError("Please enter your mobile number to reset password.")
      return
    }
    setLoading(true)
    setError("")
    setMsg("")
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}` + "/auth/forgot-password", { phone })
      setMsg("A password reset link or OTP has been sent to your phone.")
    } catch (err: any) {
      setError(err.response?.data?.detail || "Phone number not registered.")
      setError(getErrorMessage(err, "Phone number not registered."))
    } finally {
      setLoading(false)
    }
  }
  return (
    <Card className="w-full relative border-0 bg-transparent text-slate-800 shadow-none">
      <div className="absolute top-4 right-4 z-20">
        <select 
          value={lang} 
          onChange={(e) => handleLangChange(e.target.value as Language)} 
          className="p-1.5 rounded-md border border-slate-200 text-xs bg-white/80 text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 backdrop-blur-md cursor-pointer transition-colors hover:bg-white"
        >
          <option value="en">EN</option>
          <option value="hi">HI</option>
          <option value="kn">KN</option>
        </select>
      </div>
      <CardHeader className="pt-8 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">{t("welcome_back")}</CardTitle>
        <CardDescription className="text-slate-500">{t("login_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <div className="animate-in fade-in slide-in-from-top-2 text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg text-sm flex items-start gap-2 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        {msg && (
          <div className="animate-in fade-in slide-in-from-top-2 text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-sm flex items-start gap-2 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{msg}</span>
          </div>
        )}
        
        {/* Honeypot Field */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <input type="text" name="website_url" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-slate-700 font-medium">{t("mobile_number")}</Label>
          <Input 
            id="phone" 
            type="tel" 
            placeholder="+91 99999 99999" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 shadow-sm transition-all"
          />
        </div>
        {loginMethod === "password" && (
          <div className="space-y-2 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-slate-700 font-medium">{t("password")}</Label>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors font-medium hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 shadow-sm transition-all"
              />
            </div>
          </div>
        )}
        {loginMethod === "otp" && otpSent && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label htmlFor="otp" className="text-slate-700 font-medium">{t("enter_otp")}</Label>
            <Input 
              id="otp" 
              type="text" 
              placeholder="123456" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 shadow-sm tracking-widest text-center text-lg transition-all"
            />
            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={resendTimer > 0 || loading}
                onClick={handleSendOTP}
                className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors font-medium hover:underline disabled:text-slate-400 disabled:no-underline"
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
              </button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 pb-8">
        {loginMethod === "password" ? (
          <>
            <Button 
              onClick={handlePasswordLogin} 
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/20 border-0 transition-all hover:scale-[1.02] active:scale-[0.98]" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Logging in...
                </span>
              ) : t("login_password")}
            </Button>
            
            <div className="relative flex py-1 items-center w-full">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">OR</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm" 
              onClick={() => { setLoginMethod("otp"); setError(""); setMsg(""); }}
            >
              Login with OTP
            </Button>
          </>
        ) : (
          <>
            {!otpSent ? (
              <Button 
                onClick={handleSendOTP} 
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/20 border-0 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                disabled={loading}
              >
                {loading ? "Sending..." : t("send_otp")}
              </Button>
            ) : (
              <Button 
                onClick={handleVerifyOTP} 
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/20 border-0 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                disabled={loading}
              >
                {loading ? "Verifying..." : t("verify_login")}
              </Button>
            )}
            
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors" 
              onClick={() => { setLoginMethod("password"); setOtpSent(false); setError(""); setMsg(""); }}
            >
              Use Password Instead
            </Button>
          </>
        )}
        <div className="pt-6 text-sm text-center text-slate-500 w-full border-t border-slate-200">
          {t("new_rider")} 
          <Link 
            href="/questionnaire" 
            className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline ml-1 transition-colors"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
            }}
          >
            {t("register_here")}
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
