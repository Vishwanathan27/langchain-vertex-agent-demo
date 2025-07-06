// API utility for SwarnaAI chat endpoint
import axiosClient from '../../api/axiosClient';

export async function sendAIMessage(message, chat_history = []) {
  try {
    const res = await axiosClient.post('/market/chat', { message, chat_history });
    return res.data.response || 'No response.';
  } catch (err) {
    return 'Error: Could not get response.';
  }
}
