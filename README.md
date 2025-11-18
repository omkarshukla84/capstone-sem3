# EchoNote – AI-Powered Voice-to-Text Note Management System

EchoNote is an intelligent voice-to-text and AI-driven note management platform built for students, professionals, and creators. It converts spoken content—recorded live or uploaded as audio—into structured, editable, and searchable digital notes. EchoNote integrates transcription, cloud storage, AI summarization, and note organization into one seamless workflow.

---

## 🚀 Features

### 🎙️ Speech-to-Text
- Live transcription using **Web Speech API**
- Offline/Uploaded audio transcription using **Vosk**

### 🤖 AI-Powered Actions
- Summarize notes
- Extract key points
- Rewrite or clean text
- Powered by **OpenAI GPT/Gemini**

### 📝 Note Management (CRUD)
- Create, read, update, delete notes
- Save audio + transcription links
- Secure cloud storage via **Supabase Buckets**

### 🔍 Search & Organization
- Search notes
- Sort & filter notes
- Pagination for large note collections

### 🔐 Authentication
- JWT-based secure login & protected routes

---

## 🏗️ System Architecture

**Frontend:** Next.js + React + Tailwind  
**Speech Recognition:** Web Speech API (live), Vosk (uploaded audio)  
**Backend:** Node.js + Express  
**Database:** Supabase PostgreSQL  
**Auth:** JWT  
**AI Integration:** OpenAI / Gemini API  
**Storage:** Supabase Buckets  
**Hosting:** Vercel (Frontend), Render/Railway (Backend)

---

## 📌 System Flow

### 1️⃣ Live Recording Flow
1. User logs in (JWT auth).
2. Clicks **Record Audio**.
3. Browser transcribes using Web Speech API.
4. Raw audio recorded via MediaRecorder API.
5. On stop → text shown instantly + audio stored in Supabase.
6. User can summarize/extract/modify using AI.
7. Final note + audio link stored in DB.

### 2️⃣ Audio Upload Flow
1. User uploads audio file.
2. File stored in Supabase.
3. Metadata sent to Node API.
4. Vosk generates text transcription.
5. Text displayed for editing.
6. User saves the note.

### 3️⃣ AI Processing Flow
1. User selects AI action.
2. Text sent to backend AI route.
3. AI returns output to editor.
4. User saves the final note.

---

## 🔮 Future Scope
- Multilingual transcription
- PWA offline mode
- “Chat with my notes” via embeddings
- Smart reminders & calendar sync
- Analytics dashboard

---

## 🎯 Why EchoNote Is a Strong Capstone Project
- Combines **AI + Full Stack + Cloud + Real-time features**
- Demonstrates usage of:
  - Node.js
  - Supabase
  - JWT auth
  - Speech APIs
  - Open-source Vosk
  - AI models (GPT/Gemini)
- Scalable into a real SaaS

---

## ✅ Current Progress
- JWT Authentication (Completed)

More modules will be added as the project evolves.

---

Made with ❤️ by Omkar
