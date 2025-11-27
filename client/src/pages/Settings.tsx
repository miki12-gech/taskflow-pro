import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, ShieldAlert } from 'lucide-react';
import { Footer } from '../components/Footer';


// 1. DEFINE THE SHAPE OF A USER
interface User {
  id: string;
  email: string;
  name?: string; // Optional field
}

export default function Settings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 2. TELL TYPESCRIPT: "This query returns a <User> object"
  const { data: user } = useQuery<User>({ queryKey: ['auth'] });
  
  // 3. Initialize state safely (Wait for user to load)
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Update local state when user data arrives from backend
  useEffect(() => {
    if (user && user.name) {
        setName(user.name);
    }
  }, [user]);

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      // ... same logic as before ...
      const payload: any = { name };
      if (newPassword) {
         payload.currentPassword = currentPassword;
         payload.newPassword = newPassword;
      }
      return api.put('/auth/profile', payload);
    },
    onSuccess: (data) => {
      // 4. FIX SPREAD ERROR: Ensure user is an object before spreading
      if (user) {
          queryClient.setQueryData(['auth'], { ...user, ...data.data });
      }
      setMsg({ text: "Profile updated successfully!", type: "success" });
      setNewPassword(''); setCurrentPassword('');
    },
    // ... rest of code
    onError: (err: any) => {
      setMsg({ text: err.response?.data?.error || "Failed update", type: "error" });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.delete('/auth/profile'),
    onSuccess: () => {
       // 1. STOP everything.
       queryClient.cancelQueries();
       // 2. Kill the user session in React immediately.
       queryClient.setQueryData(['auth'], null);
       // 3. Wipe data.
       queryClient.clear();
       // 4. Go to Auth page.
       navigate('/auth');
    }
  });
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100 p-4 font-sans">
      <div className="max-w-xl mx-auto pt-10">
        
        {/* Nav Back */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-8 transition">
          <ArrowLeft size={20}/> Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

        {/* FEEDBACK MSG */}
        {msg.text && (
           <div className={`p-4 rounded-xl mb-6 ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
             {msg.text}
           </div>
        )}

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 space-y-6">
          
          {/* PROFILE SECTION */}
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Display Name</label>
            <input 
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 p-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your Name"
            />
          </div>

          <div className="border-t border-gray-100 dark:border-zinc-800 my-6"></div>

          {/* PASSWORD SECTION */}
          <div className="space-y-4">
             <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide">Change Password</label>
             <input 
              type="password"
              placeholder="Current Password"
              value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 p-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input 
              type="password"
              placeholder="New Password (min 8 chars)"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 p-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button 
            onClick={() => updateMutation.mutate()} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition flex justify-center gap-2 items-center"
          >
            <Save size={18} /> Save Changes
          </button>
        </div>

        {/* DANGER ZONE */}
        <div className="mt-12">
           <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2">
             <ShieldAlert size={18}/> Danger Zone
           </h3>
           <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 flex justify-between items-center">
             <div className="text-sm text-red-600 dark:text-red-400">
               Permanently delete your account and all tasks.
             </div>
             <button 
                onClick={() => { if(confirm("Are you sure? This cannot be undone.")) deleteMutation.mutate() }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition flex items-center gap-2"
              >
                <Trash2 size={16}/> Delete Account
             </button>
           </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}