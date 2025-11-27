import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Chrome } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const authMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      return api.post(endpoint, { email, password });
    },
    // --- THIS IS THE CRITICAL CHANGE ---
    onSuccess: (data) => {
      // 1. Wipe old state
      queryClient.clear();
      
      // 2. CHECK: Ensure we actually got data back
      if (!data.data || !data.data.email) {
        setErrorMessage("Login successful, but server didn't send user data. Check Backend!");
        return;
      }

      // 3. INJECT: Put the user object ({id, email...}) into cache
      queryClient.setQueryData(['auth'], data.data);

      // 4. NAVIGATE: Immediate replacement
      navigate('/', { replace: true });
    },
    // -----------------------------------
    onError: (error: any) => {
      const msg = error.response?.data?.error || "Authentication failed.";
      setErrorMessage(msg);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    authMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-gray-900">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-indigo-600 tracking-tight">TaskFlow Pro</h1>
        <p className="text-gray-500 mt-2 font-medium">Productivity made simple</p>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
          {isLogin ? "Welcome back" : "Create account"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative group">
            <Mail className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input 
              type="email" placeholder="Email address"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input 
              type="password" placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <button 
            type="submit" disabled={authMutation.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all disabled:opacity-70"
          >
            {authMutation.isPending ? "Connecting..." : (isLogin ? "Sign In" : "Get Started")}
          </button>
        </form>

        {errorMessage && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        <p className="text-center text-gray-500 mt-8 text-sm">
          {isLogin ? "No account?" : "Already user?"}{" "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setErrorMessage(null); }} 
            className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}