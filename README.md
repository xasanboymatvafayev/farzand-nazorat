# 🛡️ Farzad Nazorat - Bolalar Nazorat Ilovasi

## Loyiha Tuzilmasi
```
farzad-nazorat/
├── backend/          # Django REST API
│   ├── farzad/       # Django settings, urls, asgi
│   ├── apps/
│   │   ├── accounts/     # SMS OTP, foydalanuvchilar
│   │   ├── children/     # Farzandlar profili
│   │   ├── apps_control/ # Ilova nazorati
│   │   ├── education/    # Testlar (matematika, ingliz)
│   │   └── location/     # GPS joylashuv
│   ├── requirements.txt
│   └── Dockerfile
├── mobile/           # React Native ilovasi
│   ├── src/
│   │   ├── screens/  # Ekranlar
│   │   ├── services/ # API
│   │   └── store/    # Zustand
│   └── package.json
└── docker-compose.yml
```

---

## 🚀 BACKEND DEPLOY (VPS / Server)

### 1. Server tayyorlash (Ubuntu 22.04)
```bash
sudo apt update && sudo apt install -y docker.io docker-compose nginx certbot
```

### 2. Loyihani serverga yuklash
```bash
git clone <your-repo> /var/www/farzad
cd /var/www/farzad
```

### 3. .env faylini sozlash
```bash
cp backend/.env.example backend/.env
nano backend/.env
# SECRET_KEY, DB_PASSWORD, ESKIZ_EMAIL, ESKIZ_PASSWORD ni to'ldiring
```

### 4. Docker bilan ishga tushirish
```bash
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### 5. SSL (HTTPS) qo'shish
```bash
certbot --nginx -d yourdomain.com
```

### Tavsiya etilgan hosting:
- **Render.com** - Bepul tier bor, eng oson
- **Railway.app** - $5/oy, PostgreSQL bilan
- **DigitalOcean** - $6/oy VPS
- **Timeweb.ru** - O'zbekistonga yaqin, arzon

---

## 📱 MOBIL ILOVA - REACT NATIVE

### 1. Muhit tayyorlash
```bash
# Node.js 18+ kerak
cd mobile
npm install

# Android uchun
brew install android-studio  # Mac
# yoki Android Studio yuklab oling

# iOS uchun (Mac kerak)
cd ios && pod install && cd ..
```

### 2. API manzilini sozlash
```js
// src/services/api.js da:
export const BASE_URL = 'https://your-server.com/api';
```

---

## 📦 APK YASASH (Android)

### 1. Imzolash kalitini yaratish
```bash
cd mobile/android
keytool -genkey -v -keystore farzad-release.keystore \
  -alias farzad -keyalg RSA -keysize 2048 -validity 10000
```

### 2. gradle.properties ga kalitni yozish
```
MYAPP_UPLOAD_STORE_FILE=farzad-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=farzad
MYAPP_UPLOAD_STORE_PASSWORD=****
MYAPP_UPLOAD_KEY_PASSWORD=****
```

### 3. APK build qilish
```bash
cd mobile
# Debug APK (test uchun):
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk

# Release APK (Play Market uchun):
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk

# AAB (Play Market tavsiya qiladi):
./gradlew bundleRelease
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🍎 IPA YASASH (iOS)

### Talablar:
- MacBook (majburiy)
- Xcode 15+
- Apple Developer akkount ($99/yil)

### Qadamlar:
```bash
cd mobile
npx react-native run-ios  # test

# Release uchun:
# 1. Xcode da project ochish: mobile/ios/FarzadNazorat.xcworkspace
# 2. Product → Archive
# 3. Distribute App → App Store Connect
# 4. IPA yuklanadi
```

---

## 🏪 PLAY MARKET GA JOYLASHTIRISH

1. **Google Play Console** ga kiring: play.google.com/console
2. **Create app** → "Farzad Nazorat"
3. **Release** → **Production** → AAB faylini yuklang
4. **Store listing** to'ldiring:
   - Nomi: Farzad Nazorat
   - Tavsif: Bolalar telefon nazorati
   - Kategoriya: Parenting
   - Skrinshotlar (kamida 2 ta)
5. **Content rating** → anketa to'ldiring
6. **Submit** → 1-3 kun tekshiriladi

---

## 🍎 APP STORE GA JOYLASHTIRISH

1. **App Store Connect**: appstoreconnect.apple.com
2. **My Apps** → **+** → New App
3. Bundle ID: uz.farzad.nazorat
4. Xcode dan Archive → Upload to App Store
5. Metadata to'ldiring → Submit for Review (1-2 hafta)

---

## ⚙️ ESKIZ.UZ SMS SOZLASH

1. eskiz.uz ga ro'yxatdan o'ting
2. API kalitini oling
3. .env ga kiriting:
```
ESKIZ_EMAIL=email@gmail.com
ESKIZ_PASSWORD=password
ESKIZ_DEMO_MODE=False
```
Demo rejimda SMS yuborilmaydi, kod faqat response da ko'rinadi.

---

## 🔑 ADMIN PANEL

Backend ishga tushgach:
- URL: https://yourdomain.com/admin
- Superuser yarating: `docker-compose exec backend python manage.py createsuperuser`
- Admin paneldan 1-11 sinflar uchun test savollar qo'shing

### Test savol formati (bulk import):
```json
{
  "questions": [
    {
      "subject": "math",
      "grade": 5,
      "question_text": "15 × 4 = ?",
      "option_a": "55",
      "option_b": "60",
      "option_c": "65",
      "option_d": "70",
      "correct_answer": "B"
    }
  ]
}
```
POST: /api/education/admin/questions/bulk/

---

## 📋 API ENDPOINTLAR

| Endpoint | Metod | Tavsif |
|----------|-------|--------|
| /api/auth/send-otp/ | POST | SMS yuborish |
| /api/auth/verify-otp/ | POST | OTP tasdiqlash |
| /api/auth/set-pin/ | POST | PIN o'rnatish |
| /api/children/ | GET/POST | Farzandlar |
| /api/children/link-device/ | POST | Qurilma ulash |
| /api/apps/{id}/permissions/ | GET/POST | Ilova ruxsatlar |
| /api/location/{id}/current/ | GET | Joylashuv |
| /api/education/{id}/test/{subj}/ | GET | Test olish |
# farzand-nazorat
