/**
 * Root Administrator Security Challenge Verification Test
 * Verifies that building an Admin account via API requires the Admin Secret Key.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

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

const testAdminSecurity = async () => {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        Root Admin Account Security Challenge Test            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Clean up previous test users
  await User.deleteMany({ email: { $in: ['admin_no_secret@example.com', 'admin_wrong_secret@example.com', 'admin_valid@example.com'] } });

  const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;
  let passCount = 0;
  let failCount = 0;

  const runTest = (name, condition, details = '') => {
    if (condition) {
      console.log(`✓ PASS: ${name}`);
      if (details) console.log(`        └─ ${details}`);
      passCount++;
    } else {
      console.error(`✗ FAIL: ${name}`);
      if (details) console.error(`        └─ ${details}`);
      failCount++;
    }
  };

  try {
    // 1. Attempt to register Admin WITHOUT secret key
    console.log('--- Test 1: Register Admin WITHOUT Secret Key ---');
    const resNoSecret = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin_no_secret',
        email: 'admin_no_secret@example.com',
        password: 'SecurePass123',
        role: 'Admin'
      })
    });
    const dataNoSecret = await resNoSecret.json();
    runTest(
      'Denied registration without Admin Secret Key (HTTP 403)',
      resNoSecret.status === 403 && dataNoSecret.securityAlert === true,
      `Message: "${dataNoSecret.message}"`
    );
    console.log();

    // 2. Attempt to register Admin WITH INVALID secret key
    console.log('--- Test 2: Register Admin WITH INVALID Secret Key ---');
    const resWrongSecret = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin_wrong_secret',
        email: 'admin_wrong_secret@example.com',
        password: 'SecurePass123',
        role: 'Admin',
        adminSecret: 'wrong_secret_code'
      })
    });
    const dataWrongSecret = await resWrongSecret.json();
    runTest(
      'Denied registration with invalid Admin Secret Key (HTTP 403)',
      resWrongSecret.status === 403 && dataWrongSecret.securityAlert === true,
      `Message: "${dataWrongSecret.message}"`
    );
    console.log();

    // 3. Attempt to register Admin WITH VALID secret key
    console.log('--- Test 3: Register Admin WITH VALID Secret Key ---');
    const resValid = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin_valid',
        email: 'admin_valid@example.com',
        password: 'SecurePass123',
        role: 'Admin',
        adminSecret: process.env.ADMIN_SECRET_KEY || '0xADMIN_SECURE_KEY_2026'
      })
    });
    const dataValid = await resValid.json();
    runTest(
      'Allowed registration with valid Admin Secret Key (HTTP 201)',
      resValid.status === 201 && dataValid.user && dataValid.user.role === 'Admin',
      `Success: Created Admin "${dataValid.user?.username}" (ID: ${dataValid.user?.id})`
    );
    console.log();

  } catch (error) {
    console.error('✗ Test suite error:', error.message);
    failCount++;
  }

  // Cleanup
  await User.deleteMany({ email: { $in: ['admin_no_secret@example.com', 'admin_wrong_secret@example.com', 'admin_valid@example.com'] } });

  console.log('══════════════════════════════════════════════════════════════');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('══════════════════════════════════════════════════════════════\n');

  await mongoose.connection.close();
  process.exit(failCount > 0 ? 1 : 0);
};

connectDB().then(testAdminSecurity);
