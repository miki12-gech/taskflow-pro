export function Footer() {
  return (
    // Changed mt-auto to mt-20 for more separation
    <footer className="mt-20 py-8 text-center text-gray-500 dark:text-zinc-600 text-sm border-t border-gray-200 dark:border-zinc-800 transition-colors duration-300">
      
      <div className="flex justify-center gap-6 mb-4">
        <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy</a>
        <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms</a>
        <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Support</a>
      </div>
      
      <p>
        &copy; {new Date().getFullYear()} TaskFlow. 
        <span className="mx-2">|</span> 
        Securely built with PERN Stack.
      </p>
      
    </footer>
  );
}