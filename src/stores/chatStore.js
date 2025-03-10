import { makeAutoObservable, reaction, runInAction } from "mobx";
import realtimeSessionStore from "./realtimeSessionStore";

class ChatStore {
  messages = [];
  isConnected = false;

  constructor() {
    makeAutoObservable(this);

    // React to changes in realtimeSessionStore events
    reaction(
      () => realtimeSessionStore.events,
      (events) => {
        if (events.length > 0) {
          this.processEvents(events);
        }
      }
    );

    // React to session state changes
    reaction(
      () => realtimeSessionStore.isSessionActive,
      (isActive) => {
        runInAction(() => {
          this.isConnected = isActive;
        });
      }
    );
  }

  processEvents(events) {
    const chatMessages = [];

    // Log all events to console
    events.forEach(event => {
      console.log("[Event]", event.type, event);
    });

    for (const event of events) {
      // Handle user messages
      if (event.type === "conversation.item.create" && event.item?.type === "message" && event.item.role === "user") {
        const content = event.item.content;
        
        // Extract text content from the user message
        const text = content
          .filter(item => item.type === "input_text" || item.type === "text")
          .map(item => item.text)
          .join("\n");
        
        if (text) {
          chatMessages.push({
            id: event.event_id,
            sender: "user",
            text: text,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Handle response.done events which contain the complete assistant response
      if (event.type === "response.done" && event.response?.output && Array.isArray(event.response.output) && event.response.output.length > 0) {
        const output = event.response.output[0];
        if (output?.content && Array.isArray(output.content) && output.content.length > 0) {
          const content = output.content[0];
          // Extract the transcript or any text content from the response
          const transcript = content?.transcript || content?.text || JSON.stringify(content);
          console.log("[Response Transcript]", transcript);
          
          // Add the complete assistant response
          chatMessages.push({
            id: event.event_id,
            sender: "assistant",
            text: transcript,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    // Sort messages by timestamp and update the store
    runInAction(() => {
      // Update the messages (avoiding duplicates based on ID)
      this.messages = this.deduplicateMessages(chatMessages);
    });
  }

  deduplicateMessages(messages) {
    // Remove duplicates keeping the latest version of each message
    const uniqueMessages = [];
    const messageIds = new Set();
    
    for (const message of messages) {
      if (!messageIds.has(message.id)) {
        messageIds.add(message.id);
        uniqueMessages.push(message);
      }
    }
    
    // Sort messages by timestamp (oldest first)
    return uniqueMessages.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
  }

  sendMessage(text) {
    // Use the realtimeSessionStore to send messages
    realtimeSessionStore.sendTextMessage(text);
  }

  clearMessages() {
    runInAction(() => {
      this.messages = [];
    });
  }
}

export default new ChatStore();