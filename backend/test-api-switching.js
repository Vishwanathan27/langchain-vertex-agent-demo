// Test API provider switching via HTTP endpoint
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAPISwitching() {
  console.log('🧪 Testing API Provider Switching via HTTP...\n');
  
  try {
    // Test switching to different providers
    const providers = ['db', 'goldapi', 'metalpriceapi', 'db'];
    
    for (const provider of providers) {
      console.log(`🔄 Switching to provider: ${provider}`);
      
      try {
        const response = await axios.post(`${BASE_URL}/api/metals/admin/provider/switch`, {
          provider: provider
        });
        
        if (response.data.success) {
          console.log(`✅ Successfully switched to ${provider}`);
          console.log(`📝 Message: ${response.data.message}`);
        } else {
          console.log(`❌ Failed to switch to ${provider}`);
        }
      } catch (error) {
        console.log(`❌ Error switching to ${provider}: ${error.message}`);
      }
      
      // Test fetching prices after switching
      try {
        const priceResponse = await axios.get(`${BASE_URL}/api/metals/prices`);
        if (priceResponse.data.success) {
          const metals = Object.keys(priceResponse.data.data);
          console.log(`📊 Price data available for: ${metals.join(', ')}`);
        }
      } catch (error) {
        console.log(`❌ Error fetching prices: ${error.message}`);
      }
      
      console.log('---');
    }
    
    // Test invalid provider
    console.log('🔄 Testing invalid provider...');
    try {
      const response = await axios.post(`${BASE_URL}/api/metals/admin/provider/switch`, {
        provider: 'invalid'
      });
      console.log(`❌ Should have failed but got: ${response.data.message}`);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log(`✅ Correctly rejected invalid provider`);
      } else {
        console.log(`❌ Unexpected error: ${error.message}`);
      }
    }
    
    console.log('\n✅ API switching test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPISwitching();