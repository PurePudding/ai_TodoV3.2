import { create } from 'zustand';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  callId: string | null;
  callResult: any | null;
  users: User[];
  
  signIn: (email: string) => void;
  signOut: () => void;
  setUser: (user: User) => void;
  clearUser: () => void;
  setCallId: (id: string) => void;
  setCallResult: (result: any) => void;
  clearCallData: () => void;
  addUser: (user: User) => void;
  removeUser: (email: string) => void;
}

// Mock users for demo
const mockUsers: User[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '123-456-7890'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '123-456-7891'
  }
];

const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  callId: null,
  callResult: null,
  users: mockUsers,
  
  signIn: (email) => {
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      set({ user, isAuthenticated: true });
    }
  },
  
  signOut: () => {
    set({ user: null, isAuthenticated: false });
  },
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: true 
  }),
  
  clearUser: () => set({ 
    user: null, 
    isAuthenticated: false 
  }),
  
  setCallId: (id) => set({ 
    callId: id 
  }),
  
  setCallResult: (result) => set({ 
    callResult: result 
  }),
  
  clearCallData: () => set({ 
    callId: null, 
    callResult: null 
  }),
  
  addUser: (user) => set(state => ({
    users: [...state.users, user]
  })),
  
  removeUser: (email) => set(state => ({
    users: state.users.filter(u => u.email !== email)
  }))
}));

export default useUserStore;