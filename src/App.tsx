import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckSquare, 
  Plus, 
  ListFilter, 
  Lock, 
  Trash2, 
  SortDesc, 
  SortAsc, 
  EyeOff, 
  Eye, 
  Circle, 
  Check, 
  X 
} from 'lucide-react';

interface Task {
  id: string;
  text: string;
  done: boolean;
  timestamp: number;
}

interface Preferences {
  recentFirst: boolean;
  hideCompleted: boolean;
}

const STORAGE_KEYS = {
  ITEMS: 'todo_items_v1',
  PREFS: 'todo_prefs_v1'
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    recentFirst: true,
    hideCompleted: false
  });
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEYS.ITEMS);
      const savedPrefs = localStorage.getItem(STORAGE_KEYS.PREFS);
      
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
      
      if (savedPrefs) {
        setPreferences(prev => ({ ...prev, ...JSON.parse(savedPrefs) }));
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }, []);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks to localStorage:', error);
    }
  }, [tasks]);

  // Save preferences to localStorage whenever preferences change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences to localStorage:', error);
    }
  }, [preferences]);

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  };

  const addTask = () => {
    const trimmedText = inputValue.trim();
    if (!trimmedText) return;

    const newTask: Task = {
      id: generateId(),
      text: trimmedText,
      done: false,
      timestamp: Date.now()
    };

    setTasks(prev => [newTask, ...prev]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, done: !task.done } : task
      )
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const clearCompleted = () => {
    setTasks(prev => prev.filter(task => !task.done));
  };

  const toggleSort = () => {
    setPreferences(prev => ({ ...prev, recentFirst: !prev.recentFirst }));
  };

  const toggleHideCompleted = () => {
    setPreferences(prev => ({ ...prev, hideCompleted: !prev.hideCompleted }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  // Filter and sort tasks
  const getSortedTasks = () => {
    let filteredTasks = preferences.hideCompleted 
      ? tasks.filter(task => !task.done)
      : tasks;

    return filteredTasks.sort((a, b) => 
      preferences.recentFirst ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
    );
  };

  const sortedTasks = getSortedTasks();
  const completedCount = tasks.filter(task => task.done).length;
  const totalCount = tasks.length;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white antialiased">
      <main className="min-h-full">
        <section className="mx-auto w-full max-w-[720px] px-4 sm:px-5 md:px-6 py-10">
          {/* Header */}
          <header className="w-full">
            <div className="flex items-baseline gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/30">
                <CheckSquare className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-3xl tracking-tight font-semibold">To‑Do App</h1>
            </div>
            <p className="mt-2 text-sm text-white/60">
              Type and press Enter. No accounts. Stored locally.
            </p>
          </header>

          {/* Main Content */}
          <div className="mt-6 w-full">
            <div className="w-full rounded-2xl bg-neutral-900/60 ring-1 ring-white/10 shadow-2xl shadow-black/50 backdrop-blur">
              <div className="p-4 sm:p-5 md:p-6 space-y-4">
                {/* Input */}
                <div className="w-full rounded-xl ring-1 ring-white/10 bg-neutral-900/80">
                  <div className="flex items-center gap-3 px-3 sm:px-3.5 py-2.5">
                    <button 
                      onClick={addTask}
                      className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors"
                    >
                      <Plus className="h-4 w-4 text-white/80" />
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add a task and press Enter…"
                      className="w-full bg-transparent outline-none placeholder:text-white/40 text-sm sm:text-base"
                      autoComplete="off"
                     autoFocus
                    />
                  </div>
                </div>

                {/* Task List */}
                <div className="w-full rounded-xl ring-1 ring-white/10 bg-neutral-900/50">
                  {sortedTasks.length === 0 ? (
                    <div className="px-4 sm:px-5 py-10 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                        <ListFilter className="h-5 w-5 text-white/70" />
                      </div>
                      <p className="mt-4 text-white/70">
                        Nothing here yet. Your tasks will appear below.
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-white/5">
                      {sortedTasks.map((task) => (
                        <li key={task.id} className="group w-full bg-transparent">
                          <div className="flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-white/2.5 transition-colors">
                            {/* Custom Checkbox */}
                            <button
                              onClick={() => toggleTask(task.id)}
                              className={`toggle h-6 w-6 shrink-0 rounded-full ring-1 flex items-center justify-center transition-all hover:bg-white/10 ${
                                task.done 
                                  ? 'bg-white/10 ring-white/30' 
                                  : 'ring-white/15 bg-white/5'
                              }`}
                              aria-checked={task.done}
                              role="checkbox"
                            >
                              {task.done ? (
                                <Check className="h-3.5 w-3.5 text-white" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 text-white/70" />
                              )}
                            </button>

                            {/* Text */}
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm sm:text-base line-clamp-2 transition-colors ${
                                task.done 
                                  ? 'line-through text-white/40' 
                                  : 'text-white/90'
                              }`}>
                                {task.text}
                              </p>
                            </div>

                            {/* Timestamp */}
                            <time className="hidden sm:block text-xs text-white/40">
                              {formatDate(task.timestamp)}
                            </time>

                            {/* Delete Button */}
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="ml-2 shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Lock className="h-4 w-4" />
                  <span>Saved on this device</span>
                  <span className="ml-auto text-white/50">
                    {totalCount > 0 ? `${completedCount}/${totalCount} completed` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 w-full">
              <div className="w-full rounded-2xl bg-neutral-900/70 ring-1 ring-white/10 shadow-xl shadow-black/40 overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-3">
                  <button
                    onClick={clearCompleted}
                    disabled={completedCount === 0}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-sm hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <Trash2 className="h-4 w-4 text-white/80" />
                    <span>Clear completed</span>
                  </button>
                  
                  <button
                    onClick={toggleSort}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-sm hover:bg-white/5 transition-colors border-t border-white/10 sm:border-t-0 sm:border-l sm:border-white/10"
                  >
                    {preferences.recentFirst ? (
                      <SortDesc className="h-4 w-4 text-white/80" />
                    ) : (
                      <SortAsc className="h-4 w-4 text-white/80" />
                    )}
                    <span>{preferences.recentFirst ? 'Sort Recent' : 'Sort Oldest'}</span>
                  </button>
                  
                  <button
                    onClick={toggleHideCompleted}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-sm hover:bg-white/5 transition-colors border-t border-white/10 sm:border-l sm:border-white/10"
                  >
                    {preferences.hideCompleted ? (
                      <Eye className="h-4 w-4 text-white/80" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-white/80" />
                    )}
                    <span>{preferences.hideCompleted ? 'Show completed' : 'Hide completed'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;