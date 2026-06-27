# Monolithic MERN Integration & Setup Walkthrough

We have successfully migrated the hospital queue management system from individual folders and in-memory arrays to a unified full-stack **MERN Monorepo Architecture** with a robust MongoDB/Mongoose layer.

Additionally, to ensure your prototype works out-of-the-box in any network environment (even behind strict hackathon Wi-Fi firewalls), we implemented a **zero-setup local in-memory MongoDB fallback**.

---

## 🛠️ What Was Accomplished

1. **Monorepo Layout:**
   - Unified the root directory with a standard `.gitignore` and `.env` config.
   - Built a root `package.json` that concurrently runs the backend server and Vite frontend.
2. **Database Layer (MongoDB & Mongoose):**
   - Refactored the data store into 4 clean Mongoose models: `Doctor`, `Patient`, `PastRecord`, and `Prescription`.
   - Setup MVC pattern structure: separate controllers and routes files.
   - Wrote a custom Mongoose connection utility that automatically falls back to an in-memory MongoDB server (`mongodb-memory-server`) if the configured remote Atlas database is unreachable due to DNS/network blocks.
3. **Frontend React Scaffold:**
   - Populated the missing `frontend/src/` folder with `main.jsx`, `index.css`, and a fully styled `App.jsx` React dashboard matching the aesthetic guidelines.
   - Configured a Vite proxy so `/api/*` endpoints map perfectly to the Express server at port `5000` during development without CORS issues.
4. **Seed Script:**
   - Seeded database cleanly with canonical mock data (seeding runs automatically when falling back to the in-memory database, or can be run manually).

---

## 🚀 How to Run the Application

You can control and launch the entire stack using simple npm commands from the root directory:

### 1. Start Development Mode (Backend + Frontend concurrently)
This command starts the Express backend on port `5000` (along with its MongoDB connection/fallback) and the Vite React frontend on port `5173` concurrently:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173` to see your running hospital queue dashboard.

### 2. Manual Database Seeding
To manually drop collections and seed mock data to your configured database:
```bash
npm run seed
```

### 3. Production Build & Execution
To compile the React frontend into static assets and serve it directly from the Express server:
```bash
# Build React static assets
npm run build

# Start single-process monolithic server
npm run start
```
Open your browser to `http://localhost:5000` to access the full-stack app served by Express.
