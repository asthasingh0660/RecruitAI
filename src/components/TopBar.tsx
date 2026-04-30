'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function TopBar() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-64 right-0 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 z-40">
      <input
        type="text"
        placeholder="Search candidates..."
        className="px-4 py-2 border border-gray-300 rounded-lg w-64 focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <button
        onClick={handleLogout}
        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
      >
        Logout
      </button>
    </header>
  );
}