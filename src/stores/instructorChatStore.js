import { makeAutoObservable, runInAction, computed } from 'mobx';
import db from '../utils/db';
import realtimeSessionStore from './realtimeSessionStore';
import coursesStore from './coursesStore';

class InstructorChatStore {
  // Messages stored by instructor ID
  instructorChats = new Map(); // Map of instructor ID -> array of messages
  activeInstructorId = 1; // Default to first instructor
  isLoading = false;
  error = null;

  constructor() {
    makeAutoObservable(this, {
      currentInstructor: computed
    });
    
    // Subscribe to events from the realtimeSessionStore
    this.setupRealtimeEventListeners();
  }

  // Computed property to get the current instructor object
  get currentInstructor() {
    return coursesStore.instructors.find(instructor =>
      instructor.id === this.activeInstructorId
    );
  }

  setupRealtimeEventListeners() {
    // We'll use MobX reactions to monitor for new events
    setInterval(() => {
      if (realtimeSessionStore.isSessionActive && this.activeInstructorId) {
        // Process any new events from the session
        const events = realtimeSessionStore.events;
        if (events.length > 0) {
          this.processNewEvents(events);
        }
      }
    }, 500);
  }

  processNewEvents(events) {
    if (!this.activeInstructorId) return;

    // Get the current chat messages for this instructor
    let currentMessages = this.instructorChats.get(this.activeInstructorId) || [];
    let newMessages = [...currentMessages];
    let changed = false;

    // Process each event to extract messages
    events.forEach(event => {
      // Look for message creation events
      if (event.type === 'conversation.item.create' && event.item?.type === 'message') {
        const role = event.item.role || 'unknown';
        
        // Process text content
        if (event.item.content && Array.isArray(event.item.content)) {
          event.item.content.forEach(content => {
            if ((content.type === 'text' || content.type === 'input_text') && content.text) {
              // Check if this message already exists
              const messageExists = newMessages.some(msg => 
                msg.id === event.event_id && msg.text === content.text
              );
              
              if (!messageExists) {
                newMessages.push({
                  id: event.event_id,
                  sender: role,
                  text: content.text,
                  timestamp: new Date().toISOString()
                });
                changed = true;
              }
            }
          });
        }
      }
    });

    // If we processed new messages, update the store
    if (changed) {
      runInAction(() => {
        this.instructorChats.set(this.activeInstructorId, newMessages);
      });

      // Save to local storage for persistence
      this.saveChatsToLocalStorage();
    }
  }

  setActiveInstructor(instructorId) {
    runInAction(() => {
      this.activeInstructorId = instructorId;
      
      // If we don't have chat history for this instructor yet, initialize it
      if (!this.instructorChats.has(instructorId)) {
        this.instructorChats.set(instructorId, []);
        
        // Load any saved chats from localStorage
        this.loadChatsFromLocalStorage();
      }
    });
  }

  // Method to send a message using the realtimeSessionStore
  async sendMessage(text) {
    if (!this.activeInstructorId) {
      console.error('No active instructor selected');
      return false;
    }

    return await realtimeSessionStore.sendTextMessage(text);
  }

  // Save chats to localStorage for persistence
  saveChatsToLocalStorage() {
    try {
      // Convert Map to a serializable object
      const chatsObj = {};
      this.instructorChats.forEach((messages, instructorId) => {
        chatsObj[instructorId] = messages;
      });
      
      localStorage.setItem('instructorChats', JSON.stringify(chatsObj));
    } catch (error) {
      console.error('Failed to save chats to localStorage:', error);
    }
  }

  // Load chats from localStorage
  loadChatsFromLocalStorage() {
    try {
      const savedChats = localStorage.getItem('instructorChats');
      if (savedChats) {
        const chatsObj = JSON.parse(savedChats);
        
        // Update the Map with saved chats
        runInAction(() => {
          Object.entries(chatsObj).forEach(([instructorId, messages]) => {
            this.instructorChats.set(parseInt(instructorId), messages);
          });
        });
      }
    } catch (error) {
      console.error('Failed to load chats from localStorage:', error);
    }
  }

  // Clear chat history for a specific instructor
  clearChat(instructorId) {
    runInAction(() => {
      this.instructorChats.set(instructorId, []);
      this.saveChatsToLocalStorage();
    });
  }

  // Clear all chat history
  clearAllChats() {
    runInAction(() => {
      this.instructorChats.clear();
      localStorage.removeItem('instructorChats');
    });
  }
}

export default new InstructorChatStore();