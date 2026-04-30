'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Candidates', path: '/dashboard/candidates' },
    { name: 'Shortlist', path: '/dashboard/shortlist' },
    { name: 'Analytics', path: '/dashboard/analytics' },
    { name: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0 p-4 overflow-y-auto">
      <div className="text-2xl font-bold mb-8 text-blue-400">RecruitAI</div>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`block px-4 py-2 rounded-lg transition ${
              isActive(item.path)
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}