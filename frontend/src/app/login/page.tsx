'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { SignIn, UserPlus, CheckCircle } from '@phosphor-icons/react';

export default function LoginPage() {
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Show loading while redirecting
  if (user) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] px-6 md:px-10 flex items-center justify-center">
        <div className="font-pixel text-xl">Redirecting...</div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setEmailSent(true);
        setLoading(false);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        router.push('/setup');
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 sm:px-6 md:px-10 flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        <div className="neo-card bg-white p-5 sm:p-6 md:p-8">
          {emailSent ? (
            <div className="text-center">
              <div className="neo-card bg-[#CCFF00] p-4 sm:p-6 mb-4 sm:mb-6">
                <CheckCircle size={40} weight="bold" className="mx-auto mb-3 sm:mb-4 sm:w-12 sm:h-12" />
                <h2 className="text-lg sm:text-2xl font-pixel mb-1.5 sm:mb-2">CHECK_YOUR_EMAIL</h2>
                <p className="font-mono text-xs sm:text-sm">
                  We've sent a confirmation link to:
                </p>
                <p className="font-mono text-xs sm:text-sm font-bold mt-1.5 sm:mt-2 break-all">{email}</p>
              </div>
              <p className="font-mono text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                Click the link in the email to verify your account, then come back to login.
              </p>
              <button
                onClick={() => {
                  setEmailSent(false);
                  setIsSignUp(false);
                  setEmail('');
                  setPassword('');
                }}
                className="neo-button bg-[#FFD600] hover:bg-[#ffed4e] px-4 sm:px-6 py-2.5 sm:py-3 font-pixel text-xs sm:text-sm"
              >
                BACK_TO_LOGIN
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-pixel mb-1.5 sm:mb-2">
                  {isSignUp ? 'CREATE_ACCOUNT' : 'LOGIN'}
                </h1>
                <p className="text-xs sm:text-sm font-mono text-gray-600">
                  {isSignUp ? 'Sign up to manage your network' : 'Access your network dashboard'}
                </p>
              </div>

              {error && (
                <div className="neo-card bg-red-100 border-red-500 p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="font-mono text-xs sm:text-sm text-red-600 break-words">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block font-pixel text-[10px] sm:text-xs mb-2 sm:mb-3">EMAIL</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full neo-border p-3 sm:p-4 font-mono text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-[#FFD600] bg-white"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block font-pixel text-[10px] sm:text-xs mb-2 sm:mb-3">PASSWORD</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full neo-border p-3 sm:p-4 font-mono text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-[#FFD600] bg-white"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full neo-button bg-[#FFD600] hover:bg-[#ffed4e] px-4 sm:px-6 py-3 sm:py-4 font-pixel text-xs sm:text-sm flex items-center justify-center gap-2 sm:gap-3"
                >
                  {loading ? (
                    'PROCESSING...'
                  ) : (
                    <>
                      {isSignUp ? <UserPlus size={18} weight="bold" className="sm:w-5 sm:h-5" /> : <SignIn size={18} weight="bold" className="sm:w-5 sm:h-5" />}
                      {isSignUp ? 'SIGN_UP' : 'LOGIN'}
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 sm:mt-6 text-center">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-mono text-xs sm:text-sm text-gray-600 hover:text-black underline"
                >
                  {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign up"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
