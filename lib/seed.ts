const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function seedDefaultDataForUser(_userId: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sb-access-token') : null;
  const res = await fetch(`${API_URL}/seed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error('Failed to seed data');
  }
}
