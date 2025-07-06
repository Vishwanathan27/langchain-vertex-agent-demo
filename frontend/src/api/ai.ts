// API utility for SwarnaAI chat endpoint
import axiosClient from '../../api/axiosClient';

export async function sendAIMessage(
  input: string,
  chat_history: { role: string; parts: { text: string }[] }[] = []
): Promise<string> {
  try {
    const res = await axiosClient.post('/market/chat', {
      input,
      chat_history,
    });
    return res.data.response || 'No response.';
  } catch (err) {
    return 'Error: Could not get response.';
  }
}
