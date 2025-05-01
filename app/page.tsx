'use client';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast, Toaster } from 'sonner';

export default function App() {
  const [form, setForm] = useState({ phone: '', network: '', amount: '' });
  const [message, setMessage] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        '/api/airtimeapi',
        {
          phone: form.phone,
          firstLevel: form.network,
          amount: Number(form.amount),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': 'your-api-key',       // Replace with actual key
            'secret-key': 'your-secret-key', // Replace with actual secret
          },
        }
      );
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setForm({ phone: '', network: '', amount: '' }); // clear form
    },
    onError: (error: any) => {
      const errorMessage = ` ${error.response?.data?.error || 'Unknown error occurred'}`;
      toast.error(errorMessage);
    },
  });
  const { data: networkList, isLoading } = useQuery({
    queryKey: ['availableNetworks'],
    queryFn: async () => {
      const res = await axios.get('/api/airtimeapi');
      return res.data as Record<string, { available: boolean }>;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10,15}$/.test(form.phone)) return setMessage('Invalid phone number.');
    if (!form.network || !form.amount) return setMessage('All fields are required.');
    if (Number(form.amount) <= 0) return setMessage('Amount must be greater than 0.');
    mutate();
  };

  return (
    <>
    <Toaster position='top-center' richColors/>
      <div className="h-screen flex items-center justify-center text-black bg-fuchsia-200">
        <div className="max-w-sm md:max-w-md p-4 bg-transparent  rounded-xl shadow-2xl">
          <h1 className="text-2xl text-center p-5 font-bold mb-4">Buy Airtime</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-black"
            />
            <select
              value={form.network}
              onChange={(e) => setForm({ ...form, network: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-black"
              required
            >
              <option value="">Select Network</option>
              {networkList &&
                Object.entries(networkList).map(([key, value]) =>
                  value.available ? (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ) : null
                )}
              </select>

            <input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-black"
            />
            <button
              type="submit"
              disabled={isPending}
              className={`w-full text-white p-3 mb-5 rounded transition-colors duration-200 ${
                isPending ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-400 hover:bg-red-600'
              }`}
            >
              {isPending ? (
                <div className="flex justify-center items-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                'Submit'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
