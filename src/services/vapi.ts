import Vapi from "@vapi-ai/web";

// Initialize Vapi with API key from environment variables
export const vapi = new Vapi(import.meta.env.VITE_VAPI_API_KEY);
const assistantId = import.meta.env.VITE_ASSISTANT_ID;

// Assistant configuration
const assistantConfig = {
  name: "Taskflow Assistant",
  description: "Bantu pengguna mengelola to-do list, pengingat, dan kalender secara personal dan kolaboratif menggunakan perintah suara atau teks.",
  functions: {
    // Todo functions
    createTodo: {
      description: "Tambah tugas baru",
      parameters: {
        title: { type: "string", description: "Judul tugas" },
        description: { type: "string", description: "Deskripsi tugas (opsional)" },
        created_by: { type: "string", description: "Email pengguna yang membuat tugas" }
      }
    },
    getTodos: {
      description: "Lihat semua tugas",
      parameters: {
        user_email: { type: "string", description: "Email pengguna" }
      }
    },
    completeTodo: {
      description: "Tandai tugas selesai",
      parameters: {
        id: { type: "number", description: "ID tugas" },
        created_by: { type: "string", description: "Email pengguna" }
      }
    },
    shareTodo: {
      description: "Bagikan tugas",
      parameters: {
        todo_id: { type: "number", description: "ID tugas" },
        user_email: { type: "string", description: "Email pengguna yang akan dibagikan" }
      }
    },
    
    // Reminder functions
    addReminder: {
      description: "Tambah pengingat baru",
      parameters: {
        reminder_text: { type: "string", description: "Teks pengingat" },
        importance: { type: "string", description: "Tingkat kepentingan (low/medium/high)" },
        created_by: { type: "string", description: "Email pengguna yang membuat pengingat" }
      }
    },
    getReminders: {
      description: "Lihat semua pengingat",
      parameters: {
        user_email: { type: "string", description: "Email pengguna" }
      }
    },
    shareReminder: {
      description: "Bagikan pengingat",
      parameters: {
        reminder_id: { type: "number", description: "ID pengingat" },
        user_email: { type: "string", description: "Email pengguna yang akan dibagikan" }
      }
    },
    
    // Calendar functions
    addCalendarEntry: {
      description: "Tambah event kalender",
      parameters: {
        title: { type: "string", description: "Judul event" },
        description: { type: "string", description: "Deskripsi event (opsional)" },
        event_from: { type: "string", description: "Waktu mulai (format ISO)" },
        event_to: { type: "string", description: "Waktu selesai (format ISO)" },
        created_by: { type: "string", description: "Email pengguna yang membuat event" }
      }
    },
    getCalendarEntries: {
      description: "Lihat semua event kalender",
      parameters: {
        user_email: { type: "string", description: "Email pengguna" }
      }
    },
    shareCalendarEntry: {
      description: "Bagikan event kalender",
      parameters: {
        event_id: { type: "number", description: "ID event" },
        user_email: { type: "string", description: "Email pengguna yang akan dibagikan" }
      }
    }
  }
};

/**
 * Start the VAPI assistant with user information
 */
export const startAssistant = async (firstName: string, lastName: string, email: string, phone: string) => {
  const assistantOverrides = {
    name: assistantConfig.name,
    description: assistantConfig.description,
    variableValues: {
      firstName,
      lastName,
      email,
      phone,
    },
    functions: assistantConfig.functions
  };
  return await vapi.start(assistantId, assistantOverrides);
};

/**
 * Stop the VAPI assistant
 */
export const stopAssistant = () => {
  vapi.stop();
};

/**
 * Get call details from the backend
 */
export const getCallDetails = async (callId: string) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_DATABASE_URL}/call-details?call_id=${callId}`
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching call details:", error);
    throw error;
  }
};

/**
 * Setup VAPI event handlers
 */
export const setupVapiEventHandlers = (handlers: {
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onVolumeLevel?: (level: number) => void;
  onError?: (error: any) => void;
}) => {
  if (handlers.onCallStart) vapi.on('call-start', handlers.onCallStart);
  if (handlers.onCallEnd) vapi.on('call-end', handlers.onCallEnd);
  if (handlers.onSpeechStart) vapi.on('speech-start', handlers.onSpeechStart);
  if (handlers.onSpeechEnd) vapi.on('speech-end', handlers.onSpeechEnd);
  if (handlers.onVolumeLevel) vapi.on('volume-level', handlers.onVolumeLevel);
  if (handlers.onError) vapi.on('error', handlers.onError);
  
  // Return cleanup function
  return () => {
    if (handlers.onCallStart) vapi.off('call-start', handlers.onCallStart);
    if (handlers.onCallEnd) vapi.off('call-end', handlers.onCallEnd);
    if (handlers.onSpeechStart) vapi.off('speech-start', handlers.onSpeechStart);
    if (handlers.onSpeechEnd) vapi.off('speech-end', handlers.onSpeechEnd);
    if (handlers.onVolumeLevel) vapi.off('volume-level', handlers.onVolumeLevel);
    if (handlers.onError) vapi.off('error', handlers.onError);
  };
};

export default {
  vapi,
  startAssistant,
  stopAssistant,
  getCallDetails,
  setupVapiEventHandlers,
  assistantConfig
};