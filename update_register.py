import re

# 1. Update i18n.ts
i18n_path = 'web/src/lib/i18n.ts'
with open(i18n_path, 'r', encoding='utf-8') as f:
    i18n_text = f.read()

en_keys = """    enter_otp: "Enter OTP",
    join_rw: "Join Road Warrior",
    create_account_desc: "Create an account to start earning rewards",
    full_name: "Full Name",
    email_address: "Email Address",
    creating_account: "Creating account...",
    register: "Register",
    already_have_account: "Already have an account?",
    login_here: "Login here\""""

hi_keys = """    enter_otp: "OTP दर्ज करें",
    join_rw: "रोड वॉरियर से जुड़ें",
    create_account_desc: "इनाम जीतना शुरू करने के लिए अकाउंट बनाएं",
    full_name: "पूरा नाम",
    email_address: "ईमेल पता",
    creating_account: "अकाउंट बनाया जा रहा है...",
    register: "रजिस्टर करें",
    already_have_account: "क्या आपके पास पहले से अकाउंट है?",
    login_here: "यहाँ लॉगिन करें\""""

kn_keys = """    enter_otp: "OTP ನಮೂದಿಸಿ",
    join_rw: "ರೋಡ್ ವಾರಿಯರ್ ಸೇರಿ",
    create_account_desc: "ಬಹುಮಾನಗಳನ್ನು ಗಳಿಸಲು ಖಾತೆಯನ್ನು ರಚಿಸಿ",
    full_name: "ಪೂರ್ಣ ಹೆಸರು",
    email_address: "ಇಮೇಲ್ ವಿಳಾಸ",
    creating_account: "ಖಾತೆಯನ್ನು ರಚಿಸಲಾಗುತ್ತಿದೆ...",
    register: "ನೋಂದಾಯಿಸಿ",
    already_have_account: "ಈಗಾಗಲೇ ಖಾತೆ ಹೊಂದಿದ್ದೀರಾ?",
    login_here: "ಇಲ್ಲಿ ಲಾಗಿನ್ ಮಾಡಿ\""""

i18n_text = i18n_text.replace('    enter_otp: "Enter OTP"', en_keys)
i18n_text = i18n_text.replace('    enter_otp: "OTP दर्ज करें"', hi_keys)
i18n_text = i18n_text.replace('    enter_otp: "OTP ನಮೂದಿಸಿ"', kn_keys)

with open(i18n_path, 'w', encoding='utf-8') as f:
    f.write(i18n_text)

# 2. Update register/page.tsx
file_path = 'web/src/app/(auth)/register/page.tsx'
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
        <CardTitle>{t("join_rw")}</CardTitle>
        <CardDescription>{t("create_account_desc")}</CardDescription>"""

text = text.replace("""    <Card className="w-full">
      <CardHeader>
        <CardTitle>Join Road Warrior</CardTitle>
        <CardDescription>Create an account to start earning rewards</CardDescription>""", header)

text = text.replace('<Label htmlFor="fullName">Full Name</Label>', '<Label htmlFor="fullName">{t("full_name")}</Label>')
text = text.replace('<Label htmlFor="phone">Mobile Number</Label>', '<Label htmlFor="phone">{t("mobile_number")}</Label>')
text = text.replace('<Label htmlFor="email">Email Address</Label>', '<Label htmlFor="email">{t("email_address")}</Label>')
text = text.replace('<Label htmlFor="password">Password</Label>', '<Label htmlFor="password">{t("password")}</Label>')

text = text.replace('{loading ? "Creating account..." : "Register"}', '{loading ? t("creating_account") : t("register")}')

footer = """          <div className="text-sm text-center">
            {t("already_have_account")} 
            <Link href="/login" className="text-blue-600 hover:underline ml-1">
              {t("login_here")}
            </Link>
          </div>"""

text = re.sub(r'<div className="text-sm text-center">.*?</Link>\s*</div>', footer, text, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Translation applied successfully!')
