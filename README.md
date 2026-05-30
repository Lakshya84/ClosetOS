# ClosetOS // GenZ Creator Accessory Archive

A premium, full-stack MERN application for content creators and influencers to catalog, track, and manage their accessories (bags, jewelry, sunglasses, shoes, watches) in a clean, fashion-editorial, dark-mode-first environment. 

ClosetOS replaces scattered Notion pages and messy iPhone notes with a single, highly structured, responsive digital vault. It manages the complete lending lifecycle (ON_LOAN, SENT_TO_STYLIST, AT_PR) with real-time custody logging, strict server-side state machine enforcement, and database-optimized compound query indices.

---

## 🚀 Live Demo & Repository
- **Client Deployment (Vercel)**: `https://closetos.vercel.app` (Demo Link placeholder)
- **API Deployment (Render)**: `https://closetos-api.onrender.com` (Demo Link placeholder)

---

## 🛠️ Technology Stack

| Layer | Technology | Key Implementation Details |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) + Tailwind CSS | Chic dark-first editorial layout using Google Fonts *Outfit* & *JetBrains Mono*, glassmorphic panels, and smooth slide-up drawers. |
| **Backend** | Node.js + Express | RESTful API structure with modular routers, global error-handling middlewares, and Morgan logs. |
| **Database** | MongoDB + Mongoose | BSON document store, strict schema structures, and highly optimized compound indices. |
| **Auth** | JSON Web Tokens (JWT) | Secure JWT-driven login/registration with custom auto-logout client interceptors handling session expiry gracefully. |
| **Validation**| Zod | Strict schema validation on all inbound API requests to maintain high data integrity. |
| **Image Upload**| Cloudinary + Multer | In-memory Multer file parsing streamed directly to Cloudinary. Feature includes a bulletproof frontend asynchronous retry-on-failure workflow. |

---

## ✨ Features
1. **Premium Dark Editorial UI**: Beautiful high-contrast interface designed for GenZ creators (`#0A0A0A` background with `#C8FF00` Electric Lime accents).
2. **Dashboard Summary Strip**: Real-time stats counting Total Pieces, Out Now, Overdue, and Missing items.
3. **Smart Overdue Tray**: Pinned red neon warning banner rendered dynamically at the top if any items exceed their return date.
4. **Failsafe Image Upload with Retry Action**: Creating an item saves immediately without blocking the UI if Cloudinary is offline. Allows asynchronous retry of image attachments on upload failure.
5. **State-Machine Custody Log**: Track past custody shifts (transfers, returns, missing statuses) with a detailed chronological monospace timeline.
6. **Secure Login & Registration**: Clean, sharp auth forms using bcrypt salting and secure JWT payload exchanges.

---

## ⚡ How to Run Locally

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally (`mongodb://127.0.0.1:27017/`) or a MongoDB Atlas URI.

### 2. Backend Installation & Start
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Setup environmental configurations
# Create a .env file based on .env.example
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/closetos
JWT_SECRET=supersecretkeyforclosetos123
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Seed the database with high-end raw test data
npm run seed

# Start local server
npm run dev
```

### 3. Frontend Installation & Start
```bash
# Navigate to frontend
cd frontend

# Install dependencies with legacy peer support for React 19 / Lucide compatibility
npm install --legacy-peer-deps

# Start Vite hot-reloading development server
npm run dev
```
*Note: Vite config is pre-configured with a development proxy. All local frontend calls to `/api/...` automatically proxy to `http://localhost:5001` avoiding CORS issues.*

---

## 💎 Resume & Interview Reference Guide
*Tailored for Junior Web Developers or Analysts (1-2 years of experience) seeking to stand out in interviews by describing advanced full-stack capabilities.*

Recruiters and senior engineers look for core competencies in **performance optimization** and **system reliability**. ClosetOS provides two excellent showcase examples to add to your resume and discuss in interviews:

### 1. Compound Indexing
- **Resume Point**: *"Implemented high-performance compound indexing `{ status: 1, category: 1 }` on MongoDB documents to support sub-millisecond filtering on multi-dimensional dashboard queries."*
- **The Tech Details**: The ClosetOS dashboard heavily filters items by status (e.g. `IN_CLOSET`, `ON_LOAN`) and category (e.g. `Bag`, `Jewellery`). In a standard database, this triggers a slow **Collection Scan (COLLSCAN)**, examining every single record. By defining a compound index in Mongoose `ItemSchema.index({ status: 1, category: 1 })`, MongoDB performs a lightning-fast **Index Scan (IXSCAN)**, reducing query complexity from $O(N)$ to $O(\log N)$ and significantly cutting down server resource utilization under high concurrent loads.

### 2. Locked Status State Machine
- **Resume Point**: *"Architected a server-enforced, single-direction status state machine limiting transitions to strict lifecycles, securing custody tracking and preventing critical state exceptions."*
- **The Tech Details**: Outgoing transitions must be verified. For instance, when a piece goes `MISSING`, it locks; a user cannot transition a missing item to `ON_LOAN` directly, preserving history audit trails. Transitions are validated server-side by comparing the current state to an `ALLOWED_TRANSITIONS` map. If a creator tries to hijack the API via Postman to transfer a missing item, the server halts the action immediately and returns a clean `400 Bad Request` with structured errors, protecting database integrity.

### 📝 Example Resume Bullet Points (Copy & Paste ready):
- *Designed and developed ClosetOS, a full-stack MERN accessory lifecycle tracking app utilizing Node.js, React 19, Zod schemas, and a secure JWT authorization hierarchy.*
- *Optimized dashboard query latencies by implementing Mongoose compound indexes `{ status: 1, category: 1 }`, replacing Collection Scans with indexed key lookups.*
- *Enforced state-machine integrity on the backend by building a locked status validator that prevents illegal item movements (e.g. from MISSING to active states) and returns structured Express bad-request codes.*
- *Engineered a failsafe asynchronous image-upload handler that decouples primary database operations from secondary Cloudinary uploads, improving UX flow and incorporating automatic frontend retry mechanics on failure.*
