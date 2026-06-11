"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Language, useTranslation } from "@/lib/i18n"
import axios from "axios"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"

export default function QuestionnairePage() {
  const router = useRouter()
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [step, setStep] = useState(1)
  const [lang, setLang] = useState<Language>("en")

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

  const t = useTranslation(lang)

  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Draft Data State
  const [formData, setFormData] = useState({
    // Registration
    full_name: "", phone: "", email: "", password: "", honeypot: "",
    // Section A
    city: "", state: "", pin_code: "", delivery_platforms: [] as string[], years_experience: "",
    // Section B
    vehicle_type: "", brand: "", model: "", charging_method: "", weekly_expense: "", monthly_maintenance: "",
    // Section C
    challenges: [] as string[],
    ev_challenges: [] as string[],
    petrol_challenges: [] as string[],
    // Section D
    accidental_insurance: "", health_insurance: "", bike_insurance: "", expenses_paid_personally: "",
    // Section E
    open_to_ev: "", switch_motivators: [] as string[], interested_in: "", interested_in_products: "",
    // Section F
    has_referral: "",
    referral_code: "",
    privacy_consent: false
  })

  // Load draft from local storage on mount
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setIsLoggedIn(true)
      setStep(2)
    }

    const draft = localStorage.getItem("rw_questionnaire_draft")
    if (draft) {
      setFormData(prev => ({...prev, ...JSON.parse(draft)}))
    }
  }, [])

  // Save draft whenever formData changes
  useEffect(() => {
    localStorage.setItem("rw_questionnaire_draft", JSON.stringify(formData))
  }, [formData])

  const validateStep = (currentStep: number) => {
    const showError = () => {
      alert("Please fill all required fields before proceeding.");
      return false;
    }
    
    switch (currentStep) {
      case 1:
        if (!isLoggedIn) {
          if (!formData.full_name || !formData.phone || !formData.password) return showError();
          if (!/^[6-9]\d{9}$/.test(formData.phone)) {
            alert("Please enter a valid 10-digit Indian mobile number.");
            return false;
          }
          if (formData.password.length < 8) {
            alert("Password must be at least 8 characters long.");
            return false;
          }
        }
        return true;
      case 2:
        if (!formData.city || !formData.state || !formData.pin_code || !formData.years_experience) return showError();
        return true;
      case 3:
        if (!formData.vehicle_type || !formData.brand || !formData.model || !formData.weekly_expense || !formData.monthly_maintenance) return showError();
        return true;
      case 4:
        if (formData.challenges.length === 0 && formData.ev_challenges.length === 0 && formData.petrol_challenges.length === 0) return showError();
        return true;
      case 5:
        if (!formData.accidental_insurance || !formData.health_insurance || !formData.bike_insurance) return showError();
        return true;
      case 6:
        if (!formData.open_to_ev || !formData.interested_in) return showError();
        return true;
      case 7:
        if (!formData.has_referral || !formData.privacy_consent) {
          alert("Please complete all fields and accept the privacy policy.");
          return false;
        }
        if (formData.has_referral === "Yes" && !formData.referral_code) {
          alert("Please enter the referral code of the person who referred you.");
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 7))
    }
  }
  const handleBack = () => setStep(prev => Math.max(prev - 1, isLoggedIn ? 2 : 1))

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (formData.honeypot) return; // Bot detected
    if (!validateStep(7)) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      let token = localStorage.getItem("token")
      
      if (!isLoggedIn) {
        const recaptcha_token = executeRecaptcha ? await executeRecaptcha("register_questionnaire") : "dummy_token"
        const regRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}` + "/auth/register", {
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          recaptcha_token: recaptcha_token
        })
        token = regRes.data.access_token
        localStorage.setItem("token", token as string)
        setIsLoggedIn(true)
      }

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}` + "/questionnaire/submit", formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data && res.data.error) {
        throw new Error(res.data.error)
      }
      localStorage.removeItem("rw_questionnaire_draft")
      router.push("/dashboard/score")
    } catch (err: any) {
      console.error(err)
      const detail = err.response?.data?.detail;
      if (err.response?.status === 400 && detail === "User with this phone number or email already exists.") {
          alert("This phone number is already registered. Please log in to complete your questionnaire.")
          router.push("/login")
          return
      }
      if (err.response?.status === 400 && detail === "You have already submitted the questionnaire.") {
         localStorage.removeItem("rw_questionnaire_draft")
         router.push("/dashboard/score")
      } else {
         alert((typeof detail === 'string' ? detail : JSON.stringify(detail)) || err.message || "Submission failed.")
         setSubmitting(false)
      }
    }
  }

  const getPasswordStrength = (password: string) => {
    if (!password) return { label: "", color: "bg-transparent", score: 0 }
    if (password.length < 8) return { label: "Weak (Minimum 8 characters)", color: "bg-red-500", text: "text-red-500", score: 1 }
    
    let strength = 1
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    
    if (strength <= 2) return { label: "Weak", color: "bg-red-500", text: "text-red-500", score: 1 }
    if (strength === 3 || strength === 4) return { label: "Medium", color: "bg-yellow-500", text: "text-yellow-600", score: 2 }
    return { label: "Strong", color: "bg-green-500", text: "text-green-600", score: 3 }
  }

  const toggleArrayItem = (field: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const arr = prev[field] as string[]
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(item => item !== value) }
      } else {
        return { ...prev, [field]: [...arr, value] }
      }
    })
  }

  const renderRegistration = () => (
    <div className="space-y-4">
      <div style={{ display: 'none' }} aria-hidden="true">
        <input type="text" name="website_url" value={formData.honeypot} onChange={e => setFormData({...formData, honeypot: e.target.value})} tabIndex={-1} autoComplete="off" />
      </div>
      <h3 className="text-lg font-semibold">{t("join_rw") || "Register Account"}</h3>
      <div className="space-y-2">
        <Label>{t("full_name") || "Full Name"}</Label>
        <Input placeholder="John Doe" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
      </div>
      <div className="space-y-2">
        <Label>{t("mobile_number") || "Mobile Number"}</Label>
        <Input type="tel" placeholder="+91 99999 99999" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
      </div>
      <div className="space-y-2">
        <Label>{t("email_address") || "Email Address (Optional)"}</Label>
        <Input type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
      </div>
      <div className="space-y-2">
        <Label>{t("password") || "Password"}</Label>
        <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
        {formData.password && (
          <div className="space-y-1 mt-1">
            <div className="flex space-x-1 h-1.5">
              <div className={`flex-1 rounded-full ${getPasswordStrength(formData.password).score >= 1 ? getPasswordStrength(formData.password).color : 'bg-slate-200'}`}></div>
              <div className={`flex-1 rounded-full ${getPasswordStrength(formData.password).score >= 2 ? getPasswordStrength(formData.password).color : 'bg-slate-200'}`}></div>
              <div className={`flex-1 rounded-full ${getPasswordStrength(formData.password).score >= 3 ? getPasswordStrength(formData.password).color : 'bg-slate-200'}`}></div>
            </div>
            <p className={`text-xs font-medium text-right ${getPasswordStrength(formData.password).text}`}>
              {getPasswordStrength(formData.password).label}
            </p>
          </div>
        )}
      </div>
    </div>
  )

  const renderSectionA = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("section_a_title")}</h3>
      <div className="space-y-2">
        <Label>{t("city")}</Label>
        <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
      </div>
      <div className="space-y-2">
        <Label>{t("state")}</Label>
        <Input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
      </div>
      <div className="space-y-2">
        <Label>{t("pin_code")}</Label>
        <Input value={formData.pin_code} onChange={e => setFormData({...formData, pin_code: e.target.value})} />
      </div>
      <div className="space-y-2">
        <Label>{t("years_of_experience")}</Label>
        <Input type="number" value={formData.years_experience} onChange={e => setFormData({...formData, years_experience: e.target.value})} />
      </div>
      <div className="space-y-2">
        <Label>{t("delivery_platform")}</Label>
        <div className="grid grid-cols-2 gap-2">
          {["Swiggy", "Zomato", "Blinkit", "Porter", "Zepto", "Dunzo", "Shadowfax"].map(platform => (
            <div key={platform} className="flex items-center space-x-2">
              <Checkbox 
                id={platform} 
                checked={(formData.delivery_platforms as string[]).includes(platform)}
                onCheckedChange={() => toggleArrayItem("delivery_platforms", platform)}
              />
              <Label htmlFor={platform}>{platform}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSectionB = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("section_b_title")}</h3>
      <div className="space-y-2">
        <Label>{t("vehicle_type")}</Label>
        <RadioGroup value={formData.vehicle_type} onValueChange={v => setFormData({...formData, vehicle_type: v})}>
          <div className="flex items-center space-x-2"><RadioGroupItem value="Petrol" id="Petrol" /><Label htmlFor="Petrol">{t("petrol_two_wheeler")}</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="EV" id="EV" /><Label htmlFor="EV">{t("ev_two_wheeler")}</Label></div>
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>{t("vehicle_brand")} & {t("vehicle_model")}</Label>
        <Input placeholder={t("vehicle_brand")} value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
        <Input placeholder={t("vehicle_model")} value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
      </div>
      <div className="space-y-2">
        <Label>{t("weekly_expense")}</Label>
        <Input type="number" value={formData.weekly_expense} onChange={e => setFormData({...formData, weekly_expense: e.target.value})} />
      </div>
      <div className="space-y-2">
        <Label>{t("monthly_maintenance")}</Label>
        <Input type="number" value={formData.monthly_maintenance} onChange={e => setFormData({...formData, monthly_maintenance: e.target.value})} />
      </div>
    </div>
  )

  const renderSectionC = () => {
    const topChallenges = [
      { key: "High fuel cost", label: t("high_fuel_cost") || "High fuel cost" },
      { key: "Frequent breakdown", label: t("frequent_breakdown") || "Frequent breakdown" },
      { key: "No nearby charging station", label: t("charging_issues") || "No nearby charging station" },
      { key: "Battery range anxiety", label: t("battery_range_anxiety") || "Battery range anxiety" },
      { key: "Repair costs", label: t("repair_costs") || "Repair costs" },
      { key: "Long refuelling time", label: t("long_refuelling_time") || "Long refuelling time" },
      { key: "Other", label: t("other") || "Other" }
    ]
    const evChallenges = [
      { key: "Battery drains too fast", label: t("battery_drains_fast") || "Battery drains too fast" },
      { key: "Swapping station too far", label: t("swapping_station_far") || "Swapping station too far" },
      { key: "Long charging time at home", label: t("long_charging_time") || "Long charging time at home" },
      { key: "Vehicle not powerful enough", label: t("vehicle_not_powerful") || "Vehicle not powerful enough" },
      { key: "Service centre not nearby", label: t("service_centre_not_nearby") || "Service centre not nearby" },
      { key: "Other", label: t("other") || "Other" }
    ]
    const petrolChallenges = [
      { key: "Fuel price too high", label: t("fuel_price_high") || "Fuel price too high" },
      { key: "Frequent engine issues", label: t("frequent_engine_issues") || "Frequent engine issues" },
      { key: "Pollution fine risk", label: t("pollution_fine_risk") || "Pollution fine risk" },
      { key: "High servicing cost", label: t("high_servicing_cost") || "High servicing cost" },
      { key: "Other", label: t("other") || "Other" }
    ]

    return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("section_c_title")}</h3>
      <div className="space-y-2">
        <Label>{t("top_challenges_current") || "Top challenges with your current vehicle (multi-select)"}</Label>
        <div className="space-y-2">
          {topChallenges.map(challenge => (
            <div key={challenge.key} className="flex items-center space-x-2">
              <Checkbox 
                id={`ch-${challenge.key.replace(/\s+/g, '-')}`} 
                checked={(formData.challenges as string[]).includes(challenge.key)}
                onCheckedChange={() => toggleArrayItem("challenges", challenge.key)}
              />
              <Label htmlFor={`ch-${challenge.key.replace(/\s+/g, '-')}`}>{challenge.label}</Label>
            </div>
          ))}
        </div>
      </div>

      {formData.vehicle_type === "EV" && (
        <div className="space-y-2 pt-2 border-t border-emerald-100 mt-4">
          <Label>{t("specific_ev_challenges") || "Specific EV challenges (multi-select)"}</Label>
          <div className="space-y-2">
            {evChallenges.map(challenge => (
              <div key={challenge.key} className="flex items-center space-x-2">
                <Checkbox 
                  id={`ev-ch-${challenge.key.replace(/\s+/g, '-')}`} 
                  checked={(formData.ev_challenges as string[]).includes(challenge.key)}
                  onCheckedChange={() => toggleArrayItem("ev_challenges", challenge.key)}
                />
                <Label htmlFor={`ev-ch-${challenge.key.replace(/\s+/g, '-')}`}>{challenge.label}</Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {formData.vehicle_type === "Petrol" && (
        <div className="space-y-2 pt-2 border-t border-emerald-100 mt-4">
          <Label>{t("specific_petrol_challenges") || "Specific petrol challenges (multi-select)"}</Label>
          <div className="space-y-2">
            {petrolChallenges.map(challenge => (
              <div key={challenge.key} className="flex items-center space-x-2">
                <Checkbox 
                  id={`pet-ch-${challenge.key.replace(/\s+/g, '-')}`} 
                  checked={(formData.petrol_challenges as string[]).includes(challenge.key)}
                  onCheckedChange={() => toggleArrayItem("petrol_challenges", challenge.key)}
                />
                <Label htmlFor={`pet-ch-${challenge.key.replace(/\s+/g, '-')}`}>{challenge.label}</Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )}

  const renderSectionD = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("section_d_title")}</h3>
      <div className="space-y-2">
        <Label>{t("accidental_insurance")}</Label>
        <RadioGroup value={formData.accidental_insurance} onValueChange={v => setFormData({...formData, accidental_insurance: v})}>
          <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="ai-yes" /><Label htmlFor="ai-yes">{t("yes")}</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="ai-no" /><Label htmlFor="ai-no">{t("no")}</Label></div>
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>{t("health_insurance")}</Label>
        <RadioGroup value={formData.health_insurance} onValueChange={v => setFormData({...formData, health_insurance: v})}>
          <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="hi-yes" /><Label htmlFor="hi-yes">{t("yes")}</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="hi-no" /><Label htmlFor="hi-no">{t("no")}</Label></div>
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>{t("active_bike_insurance") || "Do you have active Bike Insurance?"}</Label>
        <RadioGroup value={formData.bike_insurance} onValueChange={v => setFormData({...formData, bike_insurance: v})}>
          <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="bi-yes" /><Label htmlFor="bi-yes">{t("yes")}</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="bi-no" /><Label htmlFor="bi-no">{t("no")}</Label></div>
        </RadioGroup>
      </div>
    </div>
  )

  const renderSectionE = () => {
    const motivators = [
      { key: "Lower rental cost", label: t("lower_rental_cost") || "Lower rental cost" },
      { key: "Better battery range", label: t("better_battery_range") || "Better battery range" },
      { key: "Swap stations nearby", label: t("swap_stations_nearby") || "Swap stations nearby" },
      { key: "Income guarantee", label: t("income_guarantee") || "Income guarantee" },
      { key: "Employer subsidy", label: t("employer_subsidy") || "Employer subsidy" },
      { key: "Other", label: t("other") || "Other" }
    ]

    return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("section_e_title")}</h3>
      <div className="space-y-2">
        <Label>{t("open_to_ev")}</Label>
        <RadioGroup value={formData.open_to_ev} onValueChange={v => setFormData({...formData, open_to_ev: v})}>
          <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="ev-yes" /><Label htmlFor="ev-yes">{t("yes")}</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="ev-no" /><Label htmlFor="ev-no">{t("no")}</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="Already On EV" id="ev-already" /><Label htmlFor="ev-already">{t("already_on_ev")}</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="Need more information" id="ev-more-info" /><Label htmlFor="ev-more-info">{t("need_more_information") || "Need more information"}</Label></div>
        </RadioGroup>
      </div>
      
      <div className="space-y-2 pt-2 border-t mt-4 border-emerald-100">
        <Label>{t("what_would_make_switch") || "What would make you switch? (multi-select)"}</Label>
        <div className="space-y-2">
          {motivators.map(motivator => (
            <div key={motivator.key} className="flex items-center space-x-2">
              <Checkbox 
                id={`mot-${motivator.key.replace(/\s+/g, '-')}`} 
                checked={(formData.switch_motivators as string[]).includes(motivator.key)}
                onCheckedChange={() => toggleArrayItem("switch_motivators", motivator.key)}
              />
              <Label htmlFor={`mot-${motivator.key.replace(/\s+/g, '-')}`}>{motivator.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t mt-4 border-emerald-100">
        <Label>{t("interested_in_offer") || "Would you be interested in:"}</Label>
        <RadioGroup value={formData.interested_in} onValueChange={v => setFormData({...formData, interested_in: v})}>
          <div className="flex items-center space-x-2"><RadioGroupItem value="EV rental offer" id="int-rental" /><Label htmlFor="int-rental">{t("ev_rental_offer") || "EV rental offer"}</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="Insurance quote" id="int-insurance" /><Label htmlFor="int-insurance">{t("insurance_quote") || "Insurance quote"}</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="Retrofit information" id="int-retrofit" /><Label htmlFor="int-retrofit">{t("retrofit_information") || "Retrofit information"}</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="All of the above" id="int-all" /><Label htmlFor="int-all">{t("all_of_the_above") || "All of the above"}</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="None" id="int-none" /><Label htmlFor="int-none">{t("none") || "None"}</Label></div>
        </RadioGroup>
      </div>

      <div className="space-y-2 pt-2 border-t mt-4 border-emerald-100">
        <Label>{t("buy_accessories") || "Are you interested in buying rider accessories or spare parts?"}</Label>
        <RadioGroup value={formData.interested_in_products} onValueChange={v => setFormData({...formData, interested_in_products: v})}>
          <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="prod-yes" /><Label htmlFor="prod-yes">{t("yes")}</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="prod-no" /><Label htmlFor="prod-no">{t("no")}</Label></div>
        </RadioGroup>
      </div>
    </div>
  )}

  const renderSectionF = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("section_f_title")}</h3>
      <div className="space-y-2">
        <Label>{t("referred_by_rider_q") || "Were you referred by another rider?"}</Label>
        <RadioGroup value={formData.has_referral} onValueChange={v => setFormData({...formData, has_referral: v})}>
          <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="ref-yes" /><Label htmlFor="ref-yes">{t("yes") || "Yes"}</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="ref-no" /><Label htmlFor="ref-no">{t("no") || "No"}</Label></div>
        </RadioGroup>
      </div>

      {formData.has_referral === "Yes" && (
        <div className="space-y-2 pt-2 border-t mt-4 border-emerald-100">
          <Label>{t("referral_code_of_person") || "Referral code of the person who referred you"}</Label>
          <Input placeholder="RW-XXXX" value={formData.referral_code} onChange={e => setFormData({...formData, referral_code: e.target.value})} />
        </div>
      )}
      
      <div className="pt-4 flex items-start space-x-2">
        <Checkbox 
          id="privacy-consent" 
          checked={(formData as any).privacy_consent}
          onCheckedChange={(c) => setFormData({...formData, privacy_consent: c === true} as any)}
        />
        <Label htmlFor="privacy-consent" className="text-xs text-slate-600 leading-tight">
          {t("privacy_consent") || "I consent to Road Warrior EV storing and processing my personal data according to the Privacy Policy."}
        </Label>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-700">Road Warrior</h1>
          <select value={lang} onChange={(e) => handleLangChange(e.target.value as Language)} className="p-2 rounded border">
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
        </div>
        
        <Progress value={(step / 7) * 100} className="w-full h-2" />
        
        <Card>
          <CardHeader>
            <CardTitle>Step {step} of 7</CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && renderRegistration()}
            {step === 2 && renderSectionA()}
            {step === 3 && renderSectionB()}
            {step === 4 && renderSectionC()}
            {step === 5 && renderSectionD()}
            {step === 6 && renderSectionE()}
            {step === 7 && renderSectionF()}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack} disabled={step === (isLoggedIn ? 2 : 1)}>
              {t("back")}
            </Button>
            {step < 7 ? (
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleNext}>
                {t("next")}
              </Button>
            ) : (
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : t("submit")}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
