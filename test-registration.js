/**
 * Test script for user registration functionality
 * This script tests the registration process with various scenarios
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Test data
const testUsers = [
  {
    username: 'testuser1',
    email: 'testuser1@example.com',
    password: 'TestPass123',
    role: 'User'
  },
  {
    username: 'adminuser',
    email: 'admin@example.com',
    password: 'AdminPass456',
    role: 'Admin'
  }
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ MongoDB connected successfully\n');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Test password hashing
const testPasswordHashing = async () => {
  console.log('=== Testing Password Hashing ===');
  const plainPassword = 'TestPassword123';
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  
  console.log('Plain password:', plainPassword);
  console.log('Hashed password:', hashedPassword);
  console.log('Hash length:', hashedPassword.length);
  
  // Verify the password
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  console.log('Password verification:', isMatch ? '✓ PASS' : '✗ FAIL');
  
  // Test wrong password
  const wrongMatch = await bcrypt.compare('WrongPassword', hashedPassword);
  console.log('Wrong password rejected:', !wrongMatch ? '✓ PASS' : '✗ FAIL');
  console.log();
};

// Test user registration
const testUserRegistration = async (userData) => {
  console.log(`--- Testing registration for: ${userData.username} ---`);
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: userData.email }, { username: userData.username }] 
    });
    
    if (existingUser) {
      console.log('⚠ User already exists, deleting for fresh test...');
      await User.deleteOne({ _id: existingUser._id });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Create new user
    const newUser = new User({
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role
    });
    
    await newUser.save();
    console.log('✓ User registered successfully');
    console.log('  - ID:', newUser._id);
    console.log('  - Username:', newUser.username);
    console.log('  - Email:', newUser.email);
    console.log('  - Role:', newUser.role);
    console.log('  - Password stored as hash:', newUser.password.substring(0, 20) + '...');
    console.log('  - Created at:', newUser.createdAt);
    
    // Verify password is hashed
    const isPasswordHashed = newUser.password !== userData.password;
    console.log('  - Password is hashed:', isPasswordHashed ? '✓ YES' : '✗ NO');
    
    // Verify password can be validated
    const isPasswordValid = await bcrypt.compare(userData.password, newUser.password);
    console.log('  - Password validation works:', isPasswordValid ? '✓ YES' : '✗ NO');
    
    return newUser;
  } catch (error) {
    console.error('✗ Registration failed:', error.message);
    return null;
  }
};

// Test duplicate user prevention
const testDuplicatePrevention = async () => {
  console.log('\n=== Testing Duplicate User Prevention ===');
  
  const duplicateUser = {
    username: 'testuser1',
    email: 'testuser1@example.com',
    password: 'AnotherPass789',
    role: 'User'
  };
  
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(duplicateUser.password, salt);
    
    const newUser = new User({
      username: duplicateUser.username,
      email: duplicateUser.email,
      password: hashedPassword,
      role: duplicateUser.role
    });
    
    await newUser.save();
    console.log('✗ FAIL: Duplicate user was allowed');
  } catch (error) {
    if (error.code === 11000) {
      console.log('✓ PASS: Duplicate user prevented correctly');
      console.log('  - Error:', error.message);
    } else {
      console.log('✗ FAIL: Unexpected error:', error.message);
    }
  }
};

// Test data retrieval
const testDataRetrieval = async () => {
  console.log('\n=== Testing Data Retrieval ===');
  
  const users = await User.find({});
  console.log(`Found ${users.length} users in database:`);
  
  users.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.username}`);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Password (hashed):', user.password.substring(0, 30) + '...');
    console.log('   Created:', user.createdAt.toLocaleString());
  });
};

// Test login simulation
const testLoginSimulation = async (email, password) => {
  console.log(`\n--- Testing login for: ${email} ---`);
  
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('✗ User not found');
      return false;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      console.log('✓ Login successful');
      console.log('  - Username:', user.username);
      console.log('  - Role:', user.role);
      return true;
    } else {
      console.log('✗ Invalid password');
      return false;
    }
  } catch (error) {
    console.error('✗ Login error:', error.message);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  User Registration Testing Suite          ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  await connectDB();
  
  // Test 1: Password hashing
  await testPasswordHashing();
  
  // Test 2: Register test users
  console.log('=== Testing User Registration ===');
  for (const userData of testUsers) {
    await testUserRegistration(userData);
    console.log();
  }
  
  // Test 3: Duplicate prevention
  await testDuplicatePrevention();
  
  // Test 4: Data retrieval
  await testDataRetrieval();
  
  // Test 5: Login simulation
  console.log('\n=== Testing Login Simulation ===');
  await testLoginSimulation('testuser1@example.com', 'TestPass123');
  await testLoginSimulation('admin@example.com', 'AdminPass456');
  await testLoginSimulation('testuser1@example.com', 'WrongPassword');
  
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  All Tests Completed!                      ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  // Close connection
  await mongoose.connection.close();
  console.log('Database connection closed.');
};

// Run the tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
