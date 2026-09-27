# 🏪 Dukaan-Dost (DukaanBot) — Voice-Based Local Language FAQ Bot for Small Shops

> **A Full-Stack, Multilingual Voice & Chat AI platform empowering local store owners (Kirana, Pharmacy, Provisions) to automate repetitive customer queries in regional languages with zero expensive hardware.**

[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS_3.4-38B2AC.svg)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/Backend-Python_FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57.svg)](https://sqlite.org/)
[![WebSpeech](https://img.shields.io/badge/Speech-Web_Speech_API_(Zero_Cost)-orange.svg)]()
[![Languages](https://img.shields.io/badge/Languages-Hindi_|_Telugu_|_Tamil_|_English-blue.svg)]()

---

## 📌 Problem & Context
Small neighborhood shopkeepers across India lose sales and spend hours every day answering identical repetitive questions over phone calls and WhatsApp:
- *"Dukaan kab khulti hai aur kab band hoti hai?"*
- *"Free home delivery kitne order par milegi?"*
- *"Do you have Fortune Oil and Aashirvaad Atta?"*
- *"Google Pay / PhonePe QR scan chalega kya?"*

Because they cannot afford dedicated customer service staff, **DukaanBot** provides an instant, self-serve solution:
1. **Shop Owner Dashboard**: Set up an FAQ knowledge base in 2 minutes, bulk import past WhatsApp chat logs, customize shop profile and timings, view analytics on top-asked questions.
2. **Customer-Facing Voice/Text Chat Widget**: Customers ask questions by typing or speaking in **Hindi, Telugu, Tamil, or English** and get immediate voice/text answers, with a 1-click fallback to WhatsApp/call the owner when a question isn't in the knowledge base.
3. **Embeddable Everywhere**: Generates a 1-line `<script>` or `<iframe>` snippet for any small business website.

---

## 🛠️ Tech Stack
- **Frontend**: React 18 + Vite + TailwindCSS + Lucide Icons
- **Backend**: Python 3.12 + FastAPI + SQLite + Uvicorn
- **AI / RAG**: Semantic retrieval with vernacular intent signals + single-call LLM contextual answering (supports **Groq free tier / Gemini / OpenAI** via standard API)
- **Speech**: Browser-native **Web Speech API** (`SpeechRecognition` & `SpeechSynthesis`) — **Zero paid STT/TTS required!**
- **Authentication**: JWT-based authentication for shopkeepers
- **Multilingual Support**: UI and voice assistants localized in **English, हिन्दी (Hindi), తెలుగు (Telugu), and தமிழ் (Tamil)**

---

## 🌟 Key Architecture & Features

### 1. 🏪 Shop Owner Dashboard
- **Authentication**: Simple JWT phone & password authentication with 1-click demo login buttons.
- **FAQ Knowledge Base Builder**: Categorized list of Q&As (Timings, Delivery, Payments, Stock, Pricing, Location) with real-time add, edit, and delete.
- **Bulk WhatsApp Chat Importer**: Paste raw customer chat exports (`.txt`) — automatically redacts PII and extracts structured FAQ entries into the knowledge base using AI.
- **Analytics & Performance Tracking**: Total queries, voice query percentage, unresolved inquiry logs, and FAQ resolution rate.
- **Shop Profile & Widget Generator**: Edit shop timings, delivery policies, UPI ID, theme colors, and copy 1-click embed code.

### 2. 💬 Customer-Facing Voice & Text Chat Widget
- **Voice Input**: Web Speech API microphone button with live transcription and automatic regional language selection (`hi-IN`, `te-IN`, `ta-IN`, `en-IN`).
- **Voice Output (TTS)**: Native browser speech synthesis with accent selection and clean text filters.
- **Smart Fallback**: If confidence is below threshold, automatically presents a **"Direct Shopkeeper Connect"** card with 1-click WhatsApp (`wa.me`) pre-filled message and direct Phone Call button.
- **Quick Question Chips**: Vernacular suggestion buttons tailored to the shop's category.

### 3. 🧩 Universal Embeddable Widget
- Small businesses can embed DukaanBot on any external website with a single `<script>` tag:
  ```html
  <script 
    src="https://your-dukaanbot-domain.com/widget.js" 
    data-shop-id="kirana-sharma" 
    data-color="#10B981">
  </script>
  ```
- Or using an `<iframe>`:
  ```html
  <iframe 
    src="https://your-dukaanbot-domain.com/?shop_id=kirana-sharma&embedded=true#customer-chat" 
    width="100%" height="600" frameborder="0" allow="microphone">
  </iframe>
  ```

---

## 🚀 Quick Start Guide

### Step 1: Clone & Configure Environment
```bash
# Copy template environment file
cp .env.example .env
```
*(Optional: Add your free Groq API key in `.env` to enable generative LLM answers. If no key is provided, DukaanBot uses deterministic verified FAQ matching).*

### Step 2: Install Backend Dependencies & Seed Data
```bash
cd backend
pip install -r requirements.txt

# Seed the 3 demo shops and verified FAQs
python seed.py
```

### Step 3: Build or Run the Frontend
```bash
cd ../frontend
npm install
npm run build
```

### Step 4: Launch DukaanBot
```bash
cd ..
python start_server.py
```
Visit **http://localhost:8000** in your browser!

---

## 👥 Pre-Seeded Demo Accounts (1-Click Login)

| Shop Name | Category | Phone Number | Password | Language |
| :--- | :--- | :--- | :--- | :--- |
| **Sharma Kirana & General Store** | Grocery & Daily Needs | `9876543210` | `kirana123` | हिन्दी (Hindi) |
| **Gupta Medicos & Healthcare** | Pharmacy & Medicine | `9415011223` | `medicos123` | Hinglish / Hindi |
| **Murugan Stores & Provisions** | South Indian Provisions | `9840199887` | `murugan123` | தமிழ் / English |

*The login screen contains 1-click quick-fill buttons for each demo shop.*

---

## 🌐 Endpoints & API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Shop owner JWT authentication |
| `POST` | `/api/auth/register` | New shopkeeper registration |
| `GET`  | `/api/auth/me` | Fetch active user profile and shop details |
| `GET`  | `/api/shop/:id` | Public shop profile (timings, delivery, UPI) |
| `GET`  | `/api/shops/all` | List all verified shops for demo switching |
| `GET`  | `/api/faq/:shop_id` | Fetch all FAQs for a shop |
| `POST` | `/api/faq` | Add new FAQ entry |
| `PUT`  | `/api/faq/:id` | Update FAQ entry |
| `DELETE`| `/api/faq/:id` | Delete FAQ entry |
| `POST` | `/api/faq/bulk-generate` | Extract structured FAQs from raw WhatsApp text |
| `POST` | `/api/chat` | Customer Q&A pipeline (RAG-lite, language detection) |
| `GET`  | `/api/analytics/:shopId`| Query logs, resolution rate, unanswered queries |
| `GET`  | `/widget.js` | Standalone script for embedding widget on external websites |
| `GET`  | `/docs` | Interactive Swagger / OpenAPI documentation |

---

## 📱 Native Android Companion App (`dukaanbot_android/`)
A fully native companion application built with **Kotlin, Jetpack Compose, Material 3, Room DB, and Android Speech APIs**:
- **Customer Voice-First Chat:** Large mic button, real-time vernacular speech-to-text (`hi-IN`, `te-IN`, `ta-IN`, `en-IN`), auto TTS audio playback, and 1-tap WhatsApp fallback.
- **Offline Resilience:** Room DB cache with `OfflineFaqMatcher` on-device keyword search so inquiries are answered even during network dropouts.
- **Merchant Portal:** Live store status switch (Open/Rush/Discount/Closed), inquiry logs, and FAQ management with voice-to-text dictation.
- **Project Location:** [dukaanbot_android/](file:///c:/Users/ADMIN/Downloads/my%20projects/New%20folder%20%282%29/dukaanbot_android) (See [dukaanbot_android/README.md](file:///c:/Users/ADMIN/Downloads/my%20projects/New%20folder%20%282%29/dukaanbot_android/README.md) for build and setup instructions).

---

## 🚢 Deployment Guide

### Deploying Frontend to Vercel
1. Set the root directory to `frontend`.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Set `VITE_API_BASE_URL` to your live backend URL (e.g. `https://dukaanbot-api.onrender.com`).

### Deploying Backend to Render or Railway
1. Set the root directory to project root or `backend`.
2. Start Command: `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`.
3. Add environment variables from `.env.example` in your Render / Railway dashboard.

---

## 📄 License
MIT License. Built for local merchants and vendors across Bharat.
