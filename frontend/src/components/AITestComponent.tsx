import React, { useState } from 'react';
import { useAI } from '../hooks/useAI';

const AITestComponent: React.FC = () => {
  const [testQuery, setTestQuery] = useState('What is the current gold trend?');
  const [testResponse, setTestResponse] = useState('');
  
  const {
    aiInsights,
    aiInsightsLoading,
    aiInsightsError,
    marketInsights,
    marketInsightsLoading,
    marketInsightsError,
    chatWithAI,
    isChatLoading,
    chatError
  } = useAI();

  const handleTestChat = async () => {
    try {
      const response = await chatWithAI(testQuery, { selectedMetal: 'gold' });
      setTestResponse(response);
    } catch (error) {
      console.error('Test chat error:', error);
      setTestResponse(`Error: ${error}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">AI System Test</h2>
      
      {/* AI Insights Test */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">AI Assistant Insights</h3>
        {aiInsightsLoading ? (
          <p className="text-blue-600">Loading AI insights...</p>
        ) : aiInsightsError ? (
          <p className="text-red-600">Error: {aiInsightsError}</p>
        ) : (
          <div className="space-y-2">
            {aiInsights.map((insight, index) => (
              <p key={index} className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                {insight}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Market Insights Test */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Market Insights</h3>
        {marketInsightsLoading ? (
          <p className="text-blue-600">Loading market insights...</p>
        ) : marketInsightsError ? (
          <p className="text-red-600">Error: {marketInsightsError}</p>
        ) : marketInsights ? (
          <div className="space-y-2">
            {marketInsights.insights.map((insight, index) => (
              <div key={index} className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                <p className="font-medium">{insight.title}</p>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            ))}
            <div className="p-2 bg-purple-50 rounded border-l-4 border-purple-500">
              <p className="font-medium">AI Recommendation</p>
              <p className="text-sm text-gray-600">{marketInsights.aiRecommendation}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No market insights available</p>
        )}
      </div>

      {/* Chat Test */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">AI Chat Test</h3>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded"
            placeholder="Ask a question..."
          />
          <button
            onClick={handleTestChat}
            disabled={isChatLoading || !testQuery.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isChatLoading ? 'Thinking...' : 'Ask AI'}
          </button>
        </div>
        {chatError && (
          <p className="text-red-600 mb-2">Chat Error: {chatError}</p>
        )}
        {testResponse && (
          <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-500">
            <p className="text-sm">{testResponse}</p>
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
        <div className="text-sm space-y-1">
          <p><strong>AI Insights Loading:</strong> {aiInsightsLoading.toString()}</p>
          <p><strong>AI Insights Error:</strong> {aiInsightsError || 'None'}</p>
          <p><strong>Market Insights Loading:</strong> {marketInsightsLoading.toString()}</p>
          <p><strong>Market Insights Error:</strong> {marketInsightsError || 'None'}</p>
          <p><strong>Chat Loading:</strong> {isChatLoading.toString()}</p>
          <p><strong>Chat Error:</strong> {chatError || 'None'}</p>
          <p><strong>AI Insights Count:</strong> {aiInsights.length}</p>
          <p><strong>Market Insights Count:</strong> {marketInsights?.insights?.length || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default AITestComponent;