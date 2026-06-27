/**
 * Comprehensive Login Testing Script
 * Tests login functionality with valid and invalid credentials
 * Tests JWT token generation and verification
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const { generateToken, verifyToken } = require('./utils/jwt');

// Test credentials
const testUsers = [
  {
    username: 'validuser',
    email: 'valid@example.com',
    password: 'ValidPass123',
    role: 'User'
  },
  {
    username: 'admintest',
    email: 'admintest@example.com',
    password: 'AdminPass456',
    role: 'Admin'
  }
];

const invalidCredentials = [
  { email: 'valid@example.com', password: 'WrongPassword123', reason: 'Wrong password' },
  { email: 'nonexistent@example.com', password: 'ValidPass123', reason: 'Non-existent email' },
  { email: 'invalid-email', password: 'ValidPass123', reason: 'Invalid email format' },
  { email: 'valid@example.com', password: '', reason: 'Empty password' },
  { email: '', password: 'ValidPass123', reason: 'Empty email' }
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

// Setup test users
const setupTestUsers = async () => {
  console.log('=== Setting Up Test Users ===');
  
  for (const userData of testUsers) {
    try {
      // Check if user exists
      let user = await User.findOne({ email: userData.email });
      
      if (user) {
        console.log(`⚠ User ${userData.email} already exists, skipping...`);
        continue;
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user
      user = new User({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: userData.role
      });
      
      await user.save();
      console.log(`✓ Created test user: ${userData.email} (${userData.role})`);
    } catch (error) {
      console.error(`✗ Error creating user ${userData.email}:`, error.message);
    }
  }
  console.log();
};

// Test valid login
const testValidLogin = async (email, password) => {
  console.log(`--- Testing Valid Login: ${email} ---`);
  
  try {
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('✗ FAIL: User not found');
      return false;
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('✗ FAIL: Password verification failed');
      return false;
    }
    
    console.log('✓ Password verified successfully');
    
    // Generate JWT token
    const token = generateToken(user);
    console.log('✓ JWT token generated');
    console.log('  Token (first 50 chars):', token.substring(0, 50) + '...');
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log('✗ FAIL: Token verification failed');
      return false;
    }
    
    console.log('✓ Token verified successfully');
    console.log('  Decoded payload:');
    console.log('    - User ID:', decoded.id);
    console.log('    - Username:', decoded.username);
    console.log('    - Email:', decoded.email);
    console.log('    - Role:', decoded.role);
    console.log('    - Expires:', new Date(decoded.exp * 1000).toLocaleString());
    
    console.log('✓ PASS: Login successful\n');
    return { success: true, token, user: decoded };
  } catch (error) {
    console.error('✗ FAIL: Error during login:', error.message);
    return false;
  }
};

// Test invalid login
const testInvalidLogin = async (email, password, reason) => {
  console.log(`--- Testing Invalid Login: ${reason} ---`);
  console.log(`  Email: ${email || '(empty)'}`);
  console.log(`  Password: ${password || '(empty)'}`);
  
  try {
    // Basic validation
    if (!email || !password) {
      console.log('✓ PASS: Empty credentials rejected (validation)\n');
      return true;
    }
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('✓ PASS: User not found (as expected)\n');
      return true;
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('✓ PASS: Invalid password rejected (as expected)\n');
      return true;
    }
    
    console.log('✗ FAIL: Login should have failed but succeeded\n');
    return false;
  } catch (error) {
    console.log('✓ PASS: Login failed with error (as expected)\n');
    return true;
  }
};

// Test token expiration
const testTokenExpiration = () => {
  console.log('--- Testing Token Expiration ---');
  
  // Create a token that expires in 1 second
  const jwt = require('jsonwebtoken');
  const shortLivedToken = jwt.sign(
    { id: 'test123', username: 'testuser' },
    process.env.JWT_SECRET,
    { expiresIn: '1s' }
  );
  
  console.log('✓ Created short-lived token (expires in 1 second)');
  
  // Verify immediately
  const decoded1 = verifyToken(shortLivedToken);
  if (decoded1) {
    console.log('✓ Token valid immediately after creation');
  } else {
    console.log('✗ Token should be valid immediately');
  }
  
  // Wait and verify after expiration
  console.log('⏳ Waiting 2 seconds for token to expire...');
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const decoded2 = verifyToken(shortLivedToken);
      if (!decoded2) {
        console.log('✓ PASS: Expired token rejected\n');
        resolve(true);
      } else {
        console.log('✗ FAIL: Expired token should be rejected\n');
        resolve(false);
      }
    }, 2000);
  });
};

// Test token tampering
const testTokenTampering = async () => {
  console.log('--- Testing Token Tampering ---');
  
  const user = await User.findOne({ email: testUsers[0].email });
  const validToken = generateToken(user);
  
  // Tamper with token
  const tamperedToken = validToken.slice(0, -5) + 'XXXXX';
  
  console.log('✓ Created tampered token');
  
  const decoded = verifyToken(tamperedToken);
  
  if (!decoded) {
    console.log('✓ PASS: Tampered token rejected\n');
    return true;
  } else {
    console.log('✗ FAIL: Tampered token should be rejected\n');
    return false;
  }
};

// Test session simulation
const testSessionSimulation = async () => {
  console.log('=== Testing Session Simulation ===');
  
  // Login
  const loginResult = await testValidLogin(testUsers[0].email, testUsers[0].password);
  
  if (!loginResult.success) {
    console.log('✗ Session test failed: Could not login\n');
    return false;
  }
  
  const token = loginResult.token;
  
  // Simulate API calls with token
  console.log('--- Simulating Protected API Calls ---');
  
  // Verify token (simulating /api/verify endpoint)
  const decoded = verifyToken(token);
  if (decoded) {
    console.log('✓ Token verification successful');
    console.log('  User can access protected routes');
  } else {
    console.log('✗ Token verification failed');
  }
  
  // Check admin access
  console.log('\n--- Testing Role-Based Access ---');
  if (decoded.role === 'Admin') {
    console.log('✓ User has Admin privileges');
  } else {
    console.log('✓ User has standard User privileges');
  }
  
  console.log();
};

// Main test runner
const runTests = async () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     Login & JWT Authentication Tests      ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  await connectDB();
  await setupTestUsers();
  
  let passCount = 0;
  let failCount = 0;
  
  // Test 1: Valid logins
  console.log('=== Testing Valid Credentials ===');
  for (const userData of testUsers) {
    const result = await testValidLogin(userData.email, userData.password);
    if (result.success) passCount++;
    else failCount++;
  }
  
  // Test 2: Invalid logins
  console.log('=== Testing Invalid Credentials ===');
  for (const cred of invalidCredentials) {
    const result = await testInvalidLogin(cred.email, cred.password, cred.reason);
    if (result) passCount++;
    else failCount++;
  }
  
  // Test 3: Token expiration
  const expResult = await testTokenExpiration();
  if (expResult) passCount++;
  else failCount++;
  
  // Test 4: Token tampering
  const tampResult = await testTokenTampering();
  if (tampResult) passCount++;
  else failCount++;
  
  // Test 5: Session simulation
  await testSessionSimulation();
  
  // Summary
  console.log('╔════════════════════════════════════════════╗');
  console.log('║            Test Summary                    ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`✓ Passed: ${passCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log(`📊 Total: ${passCount + failCount}`);
  console.log(`🎯 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%\n`);
  
  // Close connection
  await mongoose.connection.close();
  console.log('Database connection closed.');
};

// Run the tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
