import { makeAutoObservable, runInAction } from 'mobx';
import { getOpenAIBaseUrl } from '../config.js';

class AssistantChatStore {
  selectedAssistant = null;
  messages = [];
  loading = false;
  error = null;
  
  constructor() {
    makeAutoObservable(this);
  }
  
  setSelectedAssistant(assistant) {
    this.selectedAssistant = assistant;
    
    // Clear previous messages
    this.clearMessages();
    
    // Add greeting message from assistant if available
    if (assistant && assistant.greeting) {
      runInAction(() => {
        this.messages.push({
          id: 'greeting',
          sender: 'assistant',
          text: assistant.greeting,
          timestamp: new Date().toISOString()
        });
      });
    }
  }
  
  async sendMessage(text) {
    if (!this.selectedAssistant) {
      console.error('No assistant selected');
      return;
    }
    
    // Add user message to the chat
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };
    
    runInAction(() => {
      this.messages.push(userMessage);
      this.loading = true;
    });
    
    try {
      // Get API base URL
      const apiBaseUrl = getOpenAIBaseUrl();
      
      console.log("Sending message to assistant:", text);
      console.log("Using assistant prompt:", this.selectedAssistant.prompt);
      
      // Determine if we should use OpenRouter based on whether a model is selected
      const useOpenRouter = !!this.selectedAssistant.model;
      
      // Call OpenAI API with the assistant's prompt as system message
      try {
        const response = await fetch(`${apiBaseUrl}/chat${useOpenRouter ? '?api=openrouter' : ''}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.selectedAssistant.model,
            messages: [
              { role: 'system', content: this.selectedAssistant.prompt },
              ...this.messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
              }))
            ]
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response from API:", errorText);
          throw new Error(`${useOpenRouter ? 'OpenRouter' : 'OpenAI'} API request failed with status ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log("Received response from API:", data);
        
        // Add assistant response to messages
        runInAction(() => {
          this.messages.push({
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            text: data.choices[0].message.content,
            timestamp: new Date().toISOString()
          });
          this.loading = false;
        });
      } catch (error) {
        console.error(`Error sending message to ${useOpenRouter ? 'OpenRouter' : 'OpenAI'}:`, error);
        runInAction(() => {
          this.error = error.message;
          this.loading = false;
        });
      }
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
        console.error(`Error sending message to ${useOpenRouter ? 'OpenRouter' : 'OpenAI'}:`, error);
      });
    }
  }
  
  clearMessages() {
    this.messages = [];
    this.error = null;
  }
}

// Create and export a singleton instance
const assistantChatStore = new AssistantChatStore();
export default assistantChatStore;