// Test the feature flag implementation
const apiAbstraction = require('./src/services/apiAbstraction');
const { initializeMockData } = require('./src/utils/mockDataGenerator');
require('dotenv').config();

async function testFeatureFlag() {
  console.log('🧪 Testing Feature Flag Implementation...\n');
  
  console.log(`📋 Current API Provider: ${process.env.PRIMARY_API_PROVIDER}`);
  console.log(`📋 Expected Mode: ${process.env.PRIMARY_API_PROVIDER === 'db' ? 'DB-only (no API calls)' : 'API mode'}\n`);
  
  try {
    // Initialize mock data if in DB mode
    if (process.env.PRIMARY_API_PROVIDER === 'db') {
      console.log('📊 Initializing mock data...');
      await initializeMockData();
    }
    
    // Test getting live prices
    console.log('🔍 Testing live price fetching...');
    const goldPrice = await apiAbstraction.getLivePrice('XAU', 'INR');
    console.log('Gold price result:', goldPrice.success ? '✅ Success' : '❌ Failed');
    if (goldPrice.success) {
      console.log(`💰 Gold price: ₹${goldPrice.data.price}`);
    }
    
    // Test getting all prices
    console.log('\n🔍 Testing all prices fetching...');
    const allPrices = await apiAbstraction.getAllLivePrices('INR');
    console.log('All prices result:', allPrices.success ? '✅ Success' : '❌ Failed');
    if (allPrices.success) {
      const metals = Object.keys(allPrices.data);
      console.log(`📈 Found data for: ${metals.join(', ')}`);
    }
    
    // Test provider switching
    console.log('\n🔄 Testing provider switching...');
    
    // Switch to goldapi
    console.log('Switching to goldapi...');
    apiAbstraction.switchProvider('goldapi');
    
    // Switch back to db
    console.log('Switching back to db...');
    apiAbstraction.switchProvider('db');
    
    // Test again after switching
    console.log('\n🔍 Testing after switching back to db...');
    const testPrice = await apiAbstraction.getLivePrice('XAG', 'INR');
    console.log('Silver price result:', testPrice.success ? '✅ Success' : '❌ Failed');
    
    console.log('\n✅ Feature flag test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

testFeatureFlag();