// Test the authentication fix
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAuthFlow() {
  console.log('🧪 Testing Complete Authentication Flow...\n');
  
  try {
    // 1. Test login
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@swarnai.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      console.log(`👤 User: ${loginResponse.data.user.firstName} ${loginResponse.data.user.lastName}`);
      console.log(`🔐 Role: ${loginResponse.data.user.role}`);
      console.log(`📋 Permissions: ${loginResponse.data.user.permissions.length} permissions`);
      
      const token = loginResponse.data.token;
      
      // 2. Test user profile
      console.log('\n2. Testing user profile...');
      const profileResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (profileResponse.data.success) {
        console.log('✅ Profile fetch successful');
        console.log(`🎨 Current theme: ${profileResponse.data.user.preferences?.theme || 'not set'}`);
        console.log(`💰 Currency: ${profileResponse.data.user.preferences?.currency || 'not set'}`);
      }
      
      // 3. Test preferences update
      console.log('\n3. Testing preferences update...');
      const prefsResponse = await axios.put(`${BASE_URL}/api/auth/preferences`, {
        theme: 'dark',
        currency: 'USD',
        notifications: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (prefsResponse.data.success) {
        console.log('✅ Preferences updated successfully');
        console.log(`🎨 New theme: ${prefsResponse.data.preferences.theme}`);
        console.log(`💰 New currency: ${prefsResponse.data.preferences.currency}`);
      }
      
      // 4. Test activity logging
      console.log('\n4. Testing activity logging...');
      const activityResponse = await axios.get(`${BASE_URL}/api/auth/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (activityResponse.data.success) {
        console.log('✅ Activity fetch successful');
        console.log(`📊 Recent activities: ${activityResponse.data.activities.length} entries`);
        
        if (activityResponse.data.activities.length > 0) {
          const latest = activityResponse.data.activities[0];
          console.log(`📝 Latest activity: ${latest.action} - ${latest.details}`);
        }
      }
      
      console.log('\n🎉 All authentication tests passed!');
    } else {
      console.log('❌ Login failed:', loginResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
  }
}

testAuthFlow();