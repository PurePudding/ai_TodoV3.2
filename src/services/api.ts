import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_DATABASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Helper function to format tool call for the API
const formatToolCall = (functionName: string, args: Record<string, any> = {}, id: string = 'tool-call-1') => {
  return {
    message: {
      toolCalls: [
        {
          id,
          function: {
            name: functionName,
            arguments: JSON.stringify(args)
          }
        }
      ]
    }
  };
};

// Todo API
export const todoApi = {
  getTodos: async (userEmail: string) => {
    const response = await api.post('/get_todos/', formatToolCall('getTodos', { user_email: userEmail }));
    return response.data.results[0].result;
  },
  
  createTodo: async (title: string, description: string = '', createdBy: string) => {
    const response = await api.post('/create_todo/', formatToolCall('createTodo', { title, description, created_by: createdBy }));
    return response.data.results[0].result;
  },
  
  completeTodo: async (id: number, createdBy: string) => {
    const response = await api.post('/complete_todo/', formatToolCall('completeTodo', { id, created_by: createdBy }));
    return response.data.results[0].result;
  },
  
  deleteTodo: async (id: number) => {
    const response = await api.post('/delete_todo/', formatToolCall('deleteTodo', { id }));
    return response.data.results[0].result;
  },

  shareTodo: async (todoId: number, userEmail: string) => {
    const response = await api.post('/share_todo/', formatToolCall('shareTodo', { todo_id: todoId, user_email: userEmail }));
    return response.data.results[0].result;
  }
};

// Reminder API
export const reminderApi = {
  getReminders: async () => {
    const response = await api.post('/get_reminders/', formatToolCall('getReminders'));
    return response.data.results[0].result;
  },
  
  addReminder: async (reminderText: string, importance: string, createdBy: string) => {
    const response = await api.post('/add_reminder/', formatToolCall('addReminder', { 
      reminder_text: reminderText, 
      importance, 
      created_by: createdBy 
    }));
    return response.data.results[0].result;
  },
  
  deleteReminder: async (id: number) => {
    const response = await api.post('/delete_reminder/', formatToolCall('deleteReminder', { id }));
    return response.data.results[0].result;
  },

  shareReminder: async (reminderId: number, userEmail: string) => {
    const response = await api.post('/share_reminder/', formatToolCall('shareReminder', { 
      reminder_id: reminderId, 
      user_email: userEmail 
    }));
    return response.data.results[0].result;
  }
};

// Calendar API
export const calendarApi = {
  getCalendarEntries: async () => {
    const response = await api.post('/get_calendar_entries/', formatToolCall('getCalendarEntries'));
    return response.data.results[0].result;
  },
  
  addCalendarEntry: async (title: string, description: string, eventFrom: string, eventTo: string, createdBy: string) => {
    const response = await api.post('/add_calendar_entry/', 
      formatToolCall('addCalendarEntry', { 
        title, 
        description, 
        event_from: eventFrom, 
        event_to: eventTo,
        created_by: createdBy
      }));
    return response.data.results[0].result;
  },
  
  deleteCalendarEntry: async (id: number) => {
    const response = await api.post('/delete_calendar_entry/', formatToolCall('deleteCalendarEntry', { id }));
    return response.data.results[0].result;
  },

  shareCalendarEntry: async (eventId: number, userEmail: string) => {
    const response = await api.post('/share_calendar_entry/', formatToolCall('shareCalendarEntry', { 
      event_id: eventId, 
      user_email: userEmail 
    }));
    return response.data.results[0].result;
  }
};

export default api;