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
  X,
  Edit,
  Grip,
  Github
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
  id: string;
  text: string;
  done: boolean;
  timestamp: number;
  order: number;
}

interface Preferences {
  recentFirst: boolean;
  hideCompleted: boolean;
}

const STORAGE_KEYS = {
  ITEMS: 'todo_items_v2',
  PREFS: 'todo_prefs_v1'
};

interface SortableTaskProps {
  task: Task;
  editingId: string | null;
  editValue: string;
  setEditValue: (value: string) => void;
  editInputRef: React.RefObject<HTMLInputElement>;
  toggleTask: (id: string) => void;
  startEditTask: (id: string, text: string) => void;
  saveEditTask: (id: string) => void;
  handleEditKeyDown: (e: React.KeyboardEvent, id: string) => void;
  deleteTask: (id: string) => void;
  formatDate: (timestamp: number) => string;
}

function SortableTask({
  task,
  editingId,
  editValue,
  setEditValue,
  editInputRef,
  toggleTask,
  startEditTask,
  saveEditTask,
  handleEditKeyDown,
  deleteTask,
  formatDate
}: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group w-full bg-transparent"
    >
      <div className="flex items-center gap-2 px-3 sm:px-4 py-3 hover:bg-white/2.5 transition-colors">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder"
        >
          <Grip className="h-3 w-3 text-white/30 hover:text-white/50 transition-colors" />
        </button>

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
          {editingId === task.id ? (
            <input
              ref={editInputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => handleEditKeyDown(e, task.id)}
              onBlur={() => saveEditTask(task.id)}
              className="w-full bg-transparent outline-none text-sm sm:text-base text-white/90 border-b border-white/20 focus:border-white/40 transition-colors"
              autoComplete="off"
            />
          ) : (
            <p className={`text-sm sm:text-base line-clamp-2 transition-colors ${
              task.done
                ? 'line-through text-white/40'
                : 'text-white/90'
            }`}>
              {task.text}
            </p>
          )}
        </div>

        {/* Timestamp */}
        <time className="hidden sm:block text-xs text-white/40">
          {formatDate(task.timestamp)}
        </time>

        {/* Edit Button */}
        <button
          onClick={() => startEditTask(task.id, task.text)}
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          title="Edit task"
        >
          <Edit className="h-4 w-4" />
        </button>

        {/* Delete Button */}
        <button
          onClick={() => deleteTask(task.id)}
          className="ml-2 shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          title="Delete task"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    recentFirst: true,
    hideCompleted: false
  });
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEYS.ITEMS);
    const savedPrefs = localStorage.getItem(STORAGE_KEYS.PREFS);
    
    if (savedTasks) {
      const parsed = JSON.parse(savedTasks);
      // Migrate old tasks without order field
      const migratedTasks = parsed.map((task: Task, index: number) => ({
        ...task,
        order: task.order ?? index
      }));
      setTasks(migratedTasks);
    }
    
    if (savedPrefs) {
      setPreferences(prev => ({ ...prev, ...JSON.parse(savedPrefs) }));
    }
  }, []);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(tasks));
  }, [tasks]);

  // Save preferences to localStorage whenever preferences change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(preferences));
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
      timestamp: Date.now(),
      order: 0
    };

    // Shift all existing orders down and add new task at top
    setTasks(prev => [
      newTask,
      ...prev.map(t => ({ ...t, order: t.order + 1 }))
    ]);
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

  const startEditTask = (taskId: string, currentText: string) => {
    setEditingId(taskId);
    setEditValue(currentText);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const saveEditTask = (taskId: string) => {
    const trimmedText = editValue.trim();
    if (!trimmedText) return;

    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, text: trimmedText } : task
      )
    );
    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, taskId: string) => {
    if (e.key === 'Enter') {
      saveEditTask(taskId);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setTasks(prev => {
        const oldIndex = prev.findIndex(t => t.id === active.id);
        const newIndex = prev.findIndex(t => t.id === over.id);
        
        const reordered = arrayMove(prev, oldIndex, newIndex);
        // Update order field for all tasks
        return reordered.map((task, index) => ({
          ...task,
          order: index
        }));
      });
    }
  };

  // Filter and sort tasks by order
  const getSortedTasks = () => {
    let filteredTasks = preferences.hideCompleted 
      ? tasks.filter(task => !task.done)
      : tasks;

    return [...filteredTasks].sort((a, b) => a.order - b.order);
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
    <div className="min-h-screen h-full bg-neutral-950 text-white antialiased">
      <main className="min-h-screen h-full">
        <section className="mx-auto w-full max-w-[720px] px-4 sm:px-5 md:px-6 py-10 min-h-screen flex flex-col justify-center">
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
                      onKeyDown={handleKeyDown}
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
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={sortedTasks.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <ul className="divide-y divide-white/5">
                          {sortedTasks.map((task) => (
                            <SortableTask
                              key={task.id}
                              task={task}
                              editingId={editingId}
                              editValue={editValue}
                              setEditValue={setEditValue}
                              editInputRef={editInputRef}
                              toggleTask={toggleTask}
                              startEditTask={startEditTask}
                              saveEditTask={saveEditTask}
                              handleEditKeyDown={handleEditKeyDown}
                              deleteTask={deleteTask}
                              formatDate={formatDate}
                            />
                          ))}
                        </ul>
                      </SortableContext>
                    </DndContext>
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
      {/* GitHub Link */}
      <a
        href="https://github.com/1shanpanta"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10 transition-colors"
        title="GitHub"
      >
        <Github className="h-5 w-5 text-white/60 hover:text-white transition-colors" />
      </a>
    </div>
  );
}

export default App;
