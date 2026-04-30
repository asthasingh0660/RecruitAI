import axios from 'axios';

const BOLNA_API_KEY = process.env.NEXT_PUBLIC_BOLNA_API_KEY;
const BOLNA_API_BASE = 'https://api.bolna.ai/v1';

export async function triggerBolnaCall(phoneNumber: string, candidateName: string) {
  try {
    const response = await axios.post(
      `${BOLNA_API_BASE}/call`,
      {
        agent_id: process.env.NEXT_PUBLIC_BOLNA_AGENT_ID,
        phone_number: phoneNumber,
        variables: {
          candidate_name: candidateName,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${BOLNA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (err: any) {
    throw new Error(`Bolna API error: ${err.response?.data?.message || err.message}`);
  }
}