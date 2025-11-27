import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { 
  CheckCircle2, Plus, Loader2, Trash2, LogOut, Moon, Sun, 
  Pencil, X, Check, Search, Calendar as CalendarIcon, Clock, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// NEW IMPORTS: startOfToday and isBefore fix the "Overdue" logic
import { format, isToday, isTomorrow, isBefore, startOfToday } from 'date-fns';
import { Footer } from '../components/Footer';
import { TaskSkeleton } from '../components/TaskSkeleton';

// --- TYPES ---
interface Task {
  id: string;
  title: string;
  isDone: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string; 
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // --- STATES ---
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('LOW');
  const [dateInput, setDateInput] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'HIGH' | 'OVERDUE'>('ALL');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // --- THEME ---
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  useEffect(() => {
    const root = window.document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // --- QUERIES ---
  // 1. Fetch User (For Avatar/Greeting)
   const { data: user } = useQuery<User>({ 
    queryKey: ['auth'],
    queryFn: async () => { 
      const res = await api.get('/auth/me'); 
      return res.data; 
    },
    // Since App.tsx already loaded this, we trust the cache
    staleTime: Infinity 
  });

  // 2. Fetch Tasks
  const { data: tasks, isLoading, isError } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => { const res = await api.get('/tasks'); return res.data; }
  });

  // --- MUTATIONS ---
  const createTask = useMutation({
    mutationFn: (data: any) => api.post('/tasks', data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['tasks'] }); 
      // Reset inputs after adding
      setText(''); setPriority('LOW'); setDateInput('');
    }
  });

  const toggleTask = useMutation({
    mutationFn: ({ id, isDone }: { id: string; isDone: boolean }) => api.patch(`/tasks/${id}/status`, { isDone }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });
  
  const deleteTask = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const updateTask = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.patch(`/tasks/${id}/title`, { title }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setEditingId(null); }
  });

  const logout = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => { 
      // Important: clear local session data instantly to avoid errors
      queryClient.setQueryData(['auth'], null); 
      navigate('/auth'); 
    }
  });

  // --- 🪄 IMPROVED FILTER LOGIC (Fixes the Overdue issue) ---
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesFilter = true;
      if (activeFilter === 'ACTIVE') matchesFilter = !task.isDone;
      if (activeFilter === 'HIGH') matchesFilter = task.priority === 'HIGH';
      if (activeFilter === 'OVERDUE') {
         // FIXED LOGIC: Strict "Before Today" check
         if (task.isDone || !task.dueDate) return false;
         // startOfToday() returns 00:00:00 today. 
         // Any date before that timestamp is overdue.
         return isBefore(new Date(task.dueDate), startOfToday());
      }

      return matchesSearch && matchesFilter;
    });
  }, [tasks, searchQuery, activeFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    createTask.mutate({ title: text, priority, dueDate: dateInput || null });
  };
  const saveEdit = (id: string) => editTitle.trim() && updateTask.mutate({ id, title: editTitle });

  // --- HELPER DISPLAYS ---
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getDisplayName = () => {
    if (user?.name) return user.name.split(' ')[0]; // Returns "John" from "John Doe"
    if (user?.email) return user.email.split('@')[0]; // Returns "john" from "john@gmail.com"
    return "friend";
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.substring(0, 2).toUpperCase(); // e.g., "MI" from "Mikiale"
  };

  const renderDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    let label = format(date, 'MMM d');
    if (isToday(date)) label = "Today";
    if (isTomorrow(date)) label = "Tomorrow";
    
    // Check if strictly before today (for Red Badge warning)
    const isOverdue = isBefore(date, startOfToday());
    
    return (
      <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md border 
        ${isOverdue 
          ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-900 animate-pulse" 
          : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700"}`}>
        <CalendarIcon size={12} />
        {label}
        {isOverdue && <span className="hidden sm:inline font-extrabold ml-1">!</span>}
      </div>
    );
  };

  const getBadgeColor = (p: string) => {
    switch(p) {
      case 'HIGH': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200';
      case 'MEDIUM': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 text-gray-900 dark:bg-zinc-950 dark:text-gray-100 font-sans flex flex-col">
      <div className="max-w-4xl mx-auto w-full p-4 pt-6 flex-1">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
             {/* AVATAR: Links to Settings */}
             <div onClick={() => navigate('/settings')} className="cursor-pointer bg-gradient-to-tr from-indigo-500 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20 transform hover:scale-105 transition">
               {getInitials()}
             </div>
             <div>
               <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                 {getGreeting()}, <span className="text-indigo-600 dark:text-indigo-400 capitalize">{getDisplayName()}</span>
               </h1>
               <p className="text-sm text-gray-500 dark:text-gray-400">Time to clear your tasks.</p>
             </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto bg-white dark:bg-zinc-900 p-1.5 rounded-full border border-gray-100 dark:border-zinc-800 shadow-sm">
            <button onClick={toggleTheme} className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition">{theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-600" />}</button>
            <button onClick={() => navigate('/settings')} className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition" title="Settings"><Settings size={20} /></button>
            <button onClick={() => logout.mutate()} className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition" title="Log Out"><LogOut size={20} /></button>
          </div>
        </header>

        {/* SEARCH & FILTER */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"/>
          </div>
          <div className="flex gap-2 p-1 bg-gray-200/50 dark:bg-zinc-800/50 rounded-xl w-fit overflow-x-auto no-scrollbar">
            {['ALL', 'ACTIVE', 'HIGH', 'OVERDUE'].map(f => (
               <button key={f} onClick={() => setActiveFilter(f as any)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeFilter === f ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>{f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}</button>
            ))}
          </div>
        </div>

        {/* INPUT FORM */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-gray-200 dark:border-zinc-800 flex flex-col md:flex-row gap-2 mb-8 shadow-sm">
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add new task..." className="flex-1 px-4 py-3 bg-transparent outline-none text-gray-700 dark:text-white"/>
          <div className="flex gap-2">
            <div className="relative">
                <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="h-full px-3 bg-gray-50 dark:bg-zinc-950 border-none rounded-xl text-gray-600 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="bg-gray-50 dark:bg-zinc-950 text-sm px-3 py-2 rounded-xl border-none focus:outline-none cursor-pointer text-gray-600 dark:text-gray-300">
              <option value="LOW">Low</option><option value="MEDIUM">Med</option><option value="HIGH">High</option>
            </select>
            <button type="submit" disabled={createTask.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl font-bold transition flex items-center gap-2 disabled:opacity-50">{createTask.isPending ? <Loader2 className="animate-spin" /> : <Plus size={20} />}</button>
          </div>
        </form>

        {isError && <div className="p-4 bg-red-100 text-red-600 rounded-lg text-center mb-6">Failed to load tasks</div>}

        {/* LIST RENDERING WITH SKELETON */}
        <div className="space-y-3 pb-20">
          
          {isLoading ? ( 
            /* SKELETON LOADER for better UI */
            <TaskSkeleton /> 
          ) : filteredTasks.length > 0 ? (
            
            filteredTasks.map((task) => (
              <div key={task.id} className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-zinc-700 shadow-sm transition-all">
                <div className="flex items-center gap-4 w-full">
                  <button onClick={() => toggleTask.mutate({ id: task.id, isDone: !task.isDone })} className={`shrink-0 rounded-full w-6 h-6 border-2 flex items-center justify-center transition ${task.isDone ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-zinc-600"}`}>{task.isDone && <Check size={14} className="text-white" />}</button>
                  {editingId === task.id ? (
                     <div className="flex items-center gap-2 w-full animate-in fade-in zoom-in-95 duration-200">
                       <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded w-full outline-none text-gray-800 dark:text-gray-200"/>
                       <button onClick={() => saveEdit(task.id)} className="text-green-600 bg-green-100 p-1 rounded dark:bg-green-900/50"><Check size={16}/></button>
                       <button onClick={() => setEditingId(null)} className="text-red-600 bg-red-100 p-1 rounded dark:bg-red-900/50"><X size={16}/></button>
                     </div>
                  ) : ( <span className={`text-base font-medium flex-1 ${task.isDone ? "line-through text-gray-400" : "text-gray-700 dark:text-gray-200"}`}>{task.title}</span> )}
                </div>
                
                {/* META INFO */}
                <div className="flex items-center gap-3 mt-3 md:mt-0 pl-10 md:pl-0">
                  {renderDate(task.dueDate)}
                  <span className={`text-[10px] font-extrabold px-2 py-1 rounded-md border tracking-wider uppercase ${getBadgeColor(task.priority)}`}>{task.priority}</span>
                  <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingId !== task.id && (<button onClick={() => { setEditingId(task.id); setEditTitle(task.title); }} className="p-1.5 text-gray-400 hover:text-indigo-500 transition"><Pencil size={16}/></button>)}
                    <button onClick={() => deleteTask.mutate(task.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition"><Trash2 size={16}/></button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // EMPTY STATE
            <div className="text-center py-20 opacity-60 flex flex-col items-center">
               {searchQuery ? <Search className="w-12 h-12 mb-3 text-gray-300"/> : <Clock className="w-12 h-12 mb-3 text-gray-300"/>}
               <p className="text-gray-500">{searchQuery ? 'No matching tasks' : activeFilter === 'OVERDUE' ? 'Good job! No overdue tasks.' : 'All clear!'}</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}