# 🚀 Quick Start - MongoDB Connection

## Fastest Way to Get Started (5 minutes)

### 1. MongoDB Atlas (Recommended - Free & Easy)

**Step 1:** Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up

**Step 2:** Create a free cluster:
- Click "Build a Database"
- Choose "M0 Sandbox" (Free)
- Click "Create"

**Step 3:** Create database user:
- Go to "Database Access"
- Click "Add New Database User"
- Username: `ailearning`
- Password: `SecurePass123!` (or generate one)
- Role: "Atlas Admin"

**Step 4:** Allow network access:
- Go to "Network Access"
- Click "Add IP Address"
- Click "Allow Access from Anywhere"

**Step 5:** Get connection string:
- Go to "Database" → "Connect"
- Choose "Connect your application"
- Copy the connection string

**Step 6:** Update your `.env` file:
```env
MONGODB_URI=mongodb+srv://ailearning:SecurePass123!@cluster0.xxxxx.mongodb.net/ai-learning?retryWrites=true&w=majority
```

### 2. Test Connection

```bash
cd backend
node test-connection.js
```

### 3. Start Your Server

```bash
npm run dev
```

You should see:
```
🍃 MongoDB Connected: cluster0-xxxxx.mongodb.net
🚀 Server running on port 5000
```

---

## Alternative: Local MongoDB (Windows)

### Quick Install with Chocolatey:
```powershell
# Install Chocolatey (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# Install MongoDB
choco install mongodb

# Start MongoDB
net start MongoDB
```

### Or Download Installer:
1. Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Run installer → Complete installation
3. Start service: `net start MongoDB`

Keep `.env` as:
```env
MONGODB_URI=mongodb://localhost:27017/ai-learning
```

---

## Troubleshooting

**❌ Connection failed?**
```bash
node test-connection.js
```

**❌ Still issues?** Check the full `MONGODB_SETUP.md` guide for detailed solutions.

**✅ Success?** Your backend is ready! Start with:
```bash
npm run dev
```