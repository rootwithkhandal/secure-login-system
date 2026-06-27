/**
 * Database Viewer Script
 * Quick tool to view all users in the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB\n');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const viewDatabase = async () => {
  console.log('═══════════════════════════════════════════');
  console.log('         DATABASE VIEWER');
  console.log('═══════════════════════════════════════════\n');

  await connectDB();

  // Get all users
  const users = await User.find({}).sort({ createdAt: -1 });

  console.log(`📊 Total Users: ${users.length}\n`);

  if (users.length === 0) {
    console.log('No users found in database.');
  } else {
    // Count by role
    const adminCount = users.filter(u => u.role === 'Admin').length;
    const userCount = users.filter(u => u.role === 'User').length;

    console.log(`👥 Users by Role:`);
    console.log(`   - Admins: ${adminCount}`);
    console.log(`   - Users: ${userCount}\n`);

    console.log('═══════════════════════════════════════════');
    console.log('         ALL USERS');
    console.log('═══════════════════════════════════════════\n');

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🎭 Role: ${user.role}`);
      console.log(`   🔑 Password Hash: ${user.password.substring(0, 30)}...`);
      console.log(`   📅 Created: ${user.createdAt.toLocaleString()}`);
      console.log(`   🆔 ID: ${user._id}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════\n');
  }

  // Close connection
  await mongoose.connection.close();
  console.log('Database connection closed.');
};

// Run the viewer
viewDatabase().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
