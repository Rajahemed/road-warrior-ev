import re
import os

file_path = 'web/src/app/(auth)/login/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('import { useState } from "react"', 'import { useState, useEffect } from "react"')

text = text.replace('import axios from "axios"', 'import axios from "axios"\nimport { Language, useTranslation } from "@/lib/i18n"')

state_addition = """  const [lang, setLang] = useState<Language>("en")
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
"""
text = text.replace('  const [loading, setLoading] = useState(false)', state_addition + '\n  const [loading, setLoading] = useState(false)')

header = """    <Card className="w-full relative">
      <div className="absolute top-4 right-4 z-10">
        <select value={lang} onChange={(e) => handleLangChange(e.target.value as Language)} className="p-1 rounded border border-slate-200 text-xs bg-slate-50 text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="en">EN</option>
          <option value="hi">HI</option>
          <option value="kn">KN</option>
        </select>
      </div>
      <CardHeader>
        <CardTitle>{t("welcome_back")}</CardTitle>
        <CardDescription>{t("login_desc")}</CardDescription>"""

text = text.replace("""    <Card className="w-full">
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Login to your Road Warrior account</CardDescription>""", header)

text = text.replace('<Label htmlFor="phone">Mobile Number</Label>', '<Label htmlFor="phone">{t("mobile_number")}</Label>')
text = text.replace('<Label htmlFor="password">Password</Label>', '<Label htmlFor="password">{t("password")}</Label>')
text = text.replace('>Forgot Password?</button>', '>{t("forgot_password")}</button>')
text = text.replace('<Label htmlFor="otp">Enter OTP</Label>', '<Label htmlFor="otp">{t("enter_otp")}</Label>')

text = text.replace('"Login with Password"}', 't("login_password")}')
text = text.replace('>Login with OTP</Button>', '>{t("login_otp")}</Button>')

text = text.replace('"Send OTP"}', 't("send_otp")}')
text = text.replace('"Verify & Login"}', 't("verify_login")}')

text = text.replace('>Use Password Instead</Button>', '>{t("use_password")}</Button>')

footer = """        <div className="pt-4 text-sm text-center">
          {t("new_rider")} 
          <Link href="/register" className="font-semibold text-emerald-600 hover:underline ml-1">
            {t("register_here")}
          </Link>
        </div>"""

text = re.sub(r'<div className="pt-4 text-sm text-center">.*?</Link>\s*</div>', footer, text, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)


q_path = 'web/src/app/questionnaire/page.tsx'
if os.path.exists(q_path):
    with open(q_path, 'r', encoding='utf-8') as f:
        q_text = f.read()

    # Make questionnaire persist language
    q_state_addition = """  const [lang, setLang] = useState<Language>("en")

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
"""
    q_text = q_text.replace('  const [lang, setLang] = useState<Language>("en")', q_state_addition)
    q_text = q_text.replace('onChange={(e) => setLang(e.target.value as Language)}', 'onChange={(e) => handleLangChange(e.target.value as Language)}')

    with open(q_path, 'w', encoding='utf-8') as f:
        f.write(q_text)
