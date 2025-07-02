// API utility for SwarnaAI chat endpoint
import axiosClient from '../../api/axiosClient';

export async function sendAIMessage(message) {
  try {
    const res = await axiosClient.post('/igb/chat', { message });
    return res.data.response || 'No response.';
  } catch (err) {
    return 'Error: Could not get response.';
  }
}
