# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Cloud - Recommended) 🌐

### Step 1: Create Account
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Sign up for free account
3. Create organization and project

### Step 2: Create Cluster
1. Click "Build a Database"
2. Choose "M0 Sandbox" (Free tier)
3. Select cloud provider and region
4. Name your cluster (e.g., "ai-learning-cluster")

### Step 3: Create Database User
1. Go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username and strong password
5. Set role to "Atlas Admin" or "Read and write to any database"

### Step 4: Configure Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0) for development
4. Or add your specific IP address

### Step 5: Get Connection String
1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Select "Node.js" driver
4. Copy the connection string
5. Replace `<password>` with your database user password

### Step 6: Update .env File
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ai-learning?retryWrites=true&w=majority
```

---

## Option 2: Local MongoDB Installation 💻

### For Windows:

#### Method 1: MongoDB Community Server
1. **Download MongoDB:**
   - Go to [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
   - Select Windows x64
   - Download and run installer

2. **Install MongoDB:**
   - Run the .msi installer
   - Choose "Complete" installation
   - Install MongoDB as a Service
   - Install MongoDB Compass (GUI tool)

3. **Start MongoDB Service:**
   ```cmd
   net start MongoDB
   ```

4. **Verify Installation:**
   ```cmd
   mongo --version
   ```

#### Method 2: Using Chocolatey
```powershell
# Install Chocolatey first (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install MongoDB
choco install mongodb
```

#### Method 3: Using Docker
```bash
# Pull MongoDB image
docker pull mongo:latest

# Run MongoDB container
docker run -d -p 27017:27017 --name mongodb -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password mongo:latest

# Update .env for Docker
MONGODB_URI=mongodb://admin:password@localhost:27017/ai-learning?authSource=admin
```

---

## Option 3: MongoDB Compass (GUI Tool) 🖥️

If you installed MongoDB locally, you can use MongoDB Compass:

1. **Open MongoDB Compass**
2. **Connect to:** `mongodb://localhost:27017`
3. **Create Database:** `ai-learning`
4. **View Collections:** Your app will create collections automatically

---

## Testing Connection 🧪

Create a test script to verify connection:

```javascript
// test-connection.js
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
    
    // Test creating a simple document
    const testSchema = new mongoose.Schema({ name: String });
    const TestModel = mongoose.model('Test', testSchema);
    
    const testDoc = new TestModel({ name: 'Connection Test' });
    await testDoc.save();
    console.log('✅ Test document created successfully!');
    
    await TestModel.deleteOne({ name: 'Connection Test' });
    console.log('✅ Test document deleted successfully!');
    
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  }
}

testConnection();
```

Run test: `node test-connection.js`

---

## Environment Variables 📝

Make sure your `.env` file has:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
BCRYPT_SALT_ROUNDS=12
```

---

## Troubleshooting 🔧

### Common Issues:

1. **Connection Timeout:**
   - Check network access settings in Atlas
   - Verify IP whitelist includes your IP

2. **Authentication Failed:**
   - Double-check username/password
   - Ensure user has proper permissions

3. **Local MongoDB Not Starting:**
   ```cmd
   # Windows
   net start MongoDB
   
   # Or start manually
   mongod --dbpath "C:\data\db"
   ```

4. **Port Already in Use:**
   - Check if MongoDB is already running
   - Use different port: `mongodb://localhost:27018/ai-learning`

---

## Next Steps 🚀

1. Choose your preferred MongoDB option
2. Update the `.env` file with correct connection string
3. Run the backend: `npm run dev`
4. Check console for "🍃 MongoDB Connected" message
5. Test API endpoints with Postman or similar tool

---

## Security Notes 🔒

- **Never commit** your `.env` file to Git
- Use **strong passwords** for database users
- **Restrict IP access** in production
- **Enable authentication** for local MongoDB in production
- **Use environment-specific** connection strings