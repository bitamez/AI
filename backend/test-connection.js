// MongoDB Connection Test Script
const mongoose = require('mongoose');
require('dotenv').config();

console.log('🧪 Testing MongoDB Connection...\n');

async function testConnection() {
    try {
        console.log('🔗 Attempting to connect to MongoDB...');
        console.log(`📍 Connection URI: ${process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ MongoDB connected successfully!');
        console.log(`🏠 Database: ${mongoose.connection.db.databaseName}`);
        console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);

        // Test creating a simple document
        console.log('\n🧪 Testing database operations...');

        const testSchema = new mongoose.Schema({
            name: String,
            createdAt: { type: Date, default: Date.now }
        });
        const TestModel = mongoose.model('ConnectionTest', testSchema);

        // Create test document
        const testDoc = new TestModel({ name: 'Connection Test Document' });
        const savedDoc = await testDoc.save();
        console.log('✅ Test document created:', savedDoc._id);

        // Read test document
        const foundDoc = await TestModel.findById(savedDoc._id);
        console.log('✅ Test document retrieved:', foundDoc.name);

        // Update test document
        foundDoc.name = 'Updated Test Document';
        await foundDoc.save();
        console.log('✅ Test document updated');

        // Delete test document
        await TestModel.deleteOne({ _id: savedDoc._id });
        console.log('✅ Test document deleted');

        // Clean up test collection
        await mongoose.connection.db.dropCollection('connectiontests');
        console.log('✅ Test collection cleaned up');

        console.log('\n🎉 All database operations successful!');

    } catch (error) {
        console.error('\n❌ MongoDB connection error:');
        console.error('Error:', error.message);

        if (error.message.includes('ENOTFOUND')) {
            console.error('\n💡 Possible solutions:');
            console.error('   - Check your internet connection');
            console.error('   - Verify the MongoDB URI is correct');
            console.error('   - Ensure MongoDB Atlas cluster is running');
        } else if (error.message.includes('authentication failed')) {
            console.error('\n💡 Possible solutions:');
            console.error('   - Check username and password in connection string');
            console.error('   - Verify database user permissions');
            console.error('   - Ensure user exists in MongoDB Atlas');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.error('\n💡 Possible solutions:');
            console.error('   - Start local MongoDB service: net start MongoDB');
            console.error('   - Check if MongoDB is running on port 27017');
            console.error('   - Verify MongoDB is installed locally');
        }

        process.exit(1);
    } finally {
        // Close connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('🔌 Connection closed successfully');
        }
    }
}

// Run the test
testConnection();