import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    const token = request.cookies.get('jayamadmin_token')?.value || '';
    const body = await request.json();

    const response = await axios.post(
      "https://webscape.co.in/projectManagement-backend/api/employee/career",
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error forwarding to projectManagement-backend:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: error.message || 'Failed to onboard employee' };
    return NextResponse.json(data, { status });
  }
}
