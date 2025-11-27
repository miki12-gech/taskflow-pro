import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import Settings from './pages/Settings';
import { useQuery } from '@tanstack/react-query';
import { api } from './lib/axios';
import { Loader2 } from 'lucide-react'; 

function App() {
const { data: user, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      try {
        const res = await api.get('/auth/me');
        // If Backend says "No user" (200 OK but null), enforce null
        if (!res.data || !res.data.id) return null;
        return res.data;
      } catch (err) {
        return null;
      }
    },
    staleTime: Infinity,
    retry: false,
    refetchOnMount: false, // Critical to stop auto-check
    refetchOnWindowFocus: false 
  });

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center text-indigo-600 gap-2 font-medium">
        <Loader2 className="animate-spin" /> Loading TaskFlow...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* DASHBOARD (Protected) */}
        <Route 
          path="/" 
          element={user ? <Dashboard /> : <Navigate to="/auth" replace />} 
        />
        
        {/* SETTINGS (Protected) */}
        <Route 
          path="/settings" 
          element={user ? <Settings /> : <Navigate to="/auth" replace />} 
        />

        {/* AUTH (Public - Redirects to / if logged in) */}
        <Route 
          path="/auth" 
          element={user ? <Navigate to="/" replace /> : <Auth />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;