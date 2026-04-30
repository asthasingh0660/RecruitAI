import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            RecruitAI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Screen candidates with AI voice calls. Hire faster, smarter.
          </p>
          <div className="space-x-4">
            <Link
              href="/auth/login"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="inline-block px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-medium hover:bg-blue-50"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}