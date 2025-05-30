import { create } from 'zustand';

interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdBy: string;
  sharedWith: string[];
  createdAt: string;
}

interface Reminder {
  id: string;
  reminder_text: string;
  importance: string;
  createdBy: string;
  sharedWith: string[];
  createdAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_from: string;
  event_to: string;
  createdBy: string;
  sharedWith: string[];
  createdAt: string;
}

interface DataState {
  todos: Todo[];
  reminders: Reminder[];
  calendarEvents: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  
  fetchTodos: () => Promise<void>;
  fetchReminders: () => Promise<void>;
  fetchCalendarEvents: () => Promise<void>;
  fetchAllData: () => Promise<void>;
  
  addTodo: (title: string, description?: string) => Promise<void>;
  completeTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  shareTodo: (id: string, userEmail: string) => Promise<void>;
  
  addReminder: (text: string, importance: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  shareReminder: (id: string, userEmail: string) => Promise<void>;
  
  addCalendarEvent: (title: string, description: string, from: string, to: string) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;
  shareCalendarEvent: (id: string, userEmail: string) => Promise<void>;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const useDataStore = create<DataState>((set, get) => {
  // Initialize data from localStorage
  const initializeData = () => {
    const todos = JSON.parse(localStorage.getItem('todos') || '[]');
    const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    const calendarEvents = JSON.parse(localStorage.getItem('calendar_events') || '[]');
    set({ todos, reminders, calendarEvents });
  };

  // Save data to localStorage
  const saveData = (key: string, data: any[]) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  return {
    todos: [],
    reminders: [],
    calendarEvents: [],
    isLoading: false,
    error: null,
    
    fetchTodos: async () => {
      try {
        set({ isLoading: true, error: null });
        const todos = JSON.parse(localStorage.getItem('todos') || '[]');
        set({ todos, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to fetch todos', isLoading: false });
        console.error('Error fetching todos:', error);
      }
    },
    
    fetchReminders: async () => {
      try {
        set({ isLoading: true, error: null });
        const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        set({ reminders, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to fetch reminders', isLoading: false });
        console.error('Error fetching reminders:', error);
      }
    },
    
    fetchCalendarEvents: async () => {
      try {
        set({ isLoading: true, error: null });
        const calendarEvents = JSON.parse(localStorage.getItem('calendar_events') || '[]');
        set({ calendarEvents, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to fetch calendar events', isLoading: false });
        console.error('Error fetching calendar events:', error);
      }
    },
    
    fetchAllData: async () => {
      set({ isLoading: true, error: null });
      await Promise.all([
        get().fetchTodos(),
        get().fetchReminders(),
        get().fetchCalendarEvents()
      ]);
      set({ isLoading: false });
    },
    
    addTodo: async (title, description = '') => {
      try {
        set({ isLoading: true, error: null });
        const newTodo: Todo = {
          id: generateId(),
          title,
          description,
          completed: false,
          createdBy: 'user@example.com', // Replace with actual user email
          sharedWith: [],
          createdAt: new Date().toISOString()
        };
        
        const updatedTodos = [...get().todos, newTodo];
        saveData('todos', updatedTodos);
        set({ todos: updatedTodos, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to add todo', isLoading: false });
        console.error('Error adding todo:', error);
      }
    },
    
    completeTodo: async (id) => {
      try {
        set({ isLoading: true, error: null });
        const updatedTodos = get().todos.map(todo =>
          todo.id === id ? { ...todo, completed: true } : todo
        );
        saveData('todos', updatedTodos);
        set({ todos: updatedTodos, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to complete todo', isLoading: false });
        console.error('Error completing todo:', error);
      }
    },
    
    deleteTodo: async (id) => {
      try {
        set({ isLoading: true, error: null });
        const updatedTodos = get().todos.filter(todo => todo.id !== id);
        saveData('todos', updatedTodos);
        set({ todos: updatedTodos, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to delete todo', isLoading: false });
        console.error('Error deleting todo:', error);
      }
    },
    
    shareTodo: async (id, userEmail) => {
      try {
        set({ isLoading: true, error: null });
        const updatedTodos = get().todos.map(todo =>
          todo.id === id
            ? { ...todo, sharedWith: [...todo.sharedWith, userEmail] }
            : todo
        );
        saveData('todos', updatedTodos);
        set({ todos: updatedTodos, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to share todo', isLoading: false });
        console.error('Error sharing todo:', error);
      }
    },
    
    addReminder: async (reminder_text, importance) => {
      try {
        set({ isLoading: true, error: null });
        const newReminder: Reminder = {
          id: generateId(),
          reminder_text,
          importance,
          createdBy: 'user@example.com', // Replace with actual user email
          sharedWith: [],
          createdAt: new Date().toISOString()
        };
        
        const updatedReminders = [...get().reminders, newReminder];
        saveData('reminders', updatedReminders);
        set({ reminders: updatedReminders, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to add reminder', isLoading: false });
        console.error('Error adding reminder:', error);
      }
    },
    
    deleteReminder: async (id) => {
      try {
        set({ isLoading: true, error: null });
        const updatedReminders = get().reminders.filter(reminder => reminder.id !== id);
        saveData('reminders', updatedReminders);
        set({ reminders: updatedReminders, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to delete reminder', isLoading: false });
        console.error('Error deleting reminder:', error);
      }
    },
    
    shareReminder: async (id, userEmail) => {
      try {
        set({ isLoading: true, error: null });
        const updatedReminders = get().reminders.map(reminder =>
          reminder.id === id
            ? { ...reminder, sharedWith: [...reminder.sharedWith, userEmail] }
            : reminder
        );
        saveData('reminders', updatedReminders);
        set({ reminders: updatedReminders, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to share reminder', isLoading: false });
        console.error('Error sharing reminder:', error);
      }
    },
    
    addCalendarEvent: async (title, description, event_from, event_to) => {
      try {
        set({ isLoading: true, error: null });
        const newEvent: CalendarEvent = {
          id: generateId(),
          title,
          description,
          event_from,
          event_to,
          createdBy: 'user@example.com', // Replace with actual user email
          sharedWith: [],
          createdAt: new Date().toISOString()
        };
        
        const updatedEvents = [...get().calendarEvents, newEvent];
        saveData('calendar_events', updatedEvents);
        set({ calendarEvents: updatedEvents, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to add calendar event', isLoading: false });
        console.error('Error adding calendar event:', error);
      }
    },
    
    deleteCalendarEvent: async (id) => {
      try {
        set({ isLoading: true, error: null });
        const updatedEvents = get().calendarEvents.filter(event => event.id !== id);
        saveData('calendar_events', updatedEvents);
        set({ calendarEvents: updatedEvents, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to delete calendar event', isLoading: false });
        console.error('Error deleting calendar event:', error);
      }
    },
    
    shareCalendarEvent: async (id, userEmail) => {
      try {
        set({ isLoading: true, error: null });
        const updatedEvents = get().calendarEvents.map(event =>
          event.id === id
            ? { ...event, sharedWith: [...event.sharedWith, userEmail] }
            : event
        );
        saveData('calendar_events', updatedEvents);
        set({ calendarEvents: updatedEvents, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to share calendar event', isLoading: false });
        console.error('Error sharing calendar event:', error);
      }
    }
  };
});

export default useDataStore;