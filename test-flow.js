// Complete AI Flow Test
console.log('🧪 Testing Complete AI Flow...');

async function testCompleteFlow() {
  const API_BASE = 'http://localhost:3000';
  
  console.log('\n🔧 1. Testing AI Assistant...');
  try {
    const assistantResponse = await fetch(`${API_BASE}/api/metals/ai/assistant`);
    const assistantData = await assistantResponse.json();
    console.log('✅ AI Assistant Response:', assistantData);
    
    if (assistantData.success && assistantData.data?.insights) {
      console.log('✅ AI Assistant insights found:', assistantData.data.insights);
    } else {
      console.error('❌ Unexpected AI Assistant structure');
    }
  } catch (error) {
    console.error('❌ AI Assistant Error:', error);
  }
  
  console.log('\n📊 2. Testing Market Insights...');
  try {
    const marketResponse = await fetch(`${API_BASE}/api/metals/ai/market-insights`);
    const marketData = await marketResponse.json();
    console.log('✅ Market Insights Response:', marketData);
    
    if (marketData.success && marketData.data?.insights) {
      console.log('✅ Market insights found:', marketData.data.insights);
      console.log('✅ AI recommendation:', marketData.data.aiRecommendation);
    } else {
      console.error('❌ Unexpected Market Insights structure');
    }
  } catch (error) {
    console.error('❌ Market Insights Error:', error);
  }
  
  console.log('\n💬 3. Testing AI Chat...');
  try {
    const chatResponse = await fetch(`${API_BASE}/api/metals/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is the current gold trend and should I buy now?',
        context: { selectedMetal: 'gold' }
      })
    });
    const chatData = await chatResponse.json();
    console.log('✅ Chat Response:', chatData);
    
    if (chatData.success && chatData.response) {
      console.log('✅ Chat response received:', chatData.response);
    } else {
      console.error('❌ Unexpected Chat response structure');
    }
  } catch (error) {
    console.error('❌ Chat Error:', error);
  }
  
  console.log('\n🎉 AI Flow Test Complete!');
}

testCompleteFlow();