import { makeAutoObservable, runInAction } from 'mobx';
import { post } from '../utils/db.js';

class AssistantChatStore {
  selectedAssistant = null;
  messages = [];
  loading = false;
  error = null;
  selectedImageSize = '512x512';
  selectedVideoResolution = '1280x720';
  selectedVoice = 'alloy';
  
  voices = [
    { id: 'alloy', name: 'Alloy', description: 'Neutral' },
    { id: 'ash', name: 'Ash', description: 'Warm' },
    //{ id: 'ballad', name: 'Ballad', description: 'Melodic' },
    { id: 'coral', name: 'Coral', description: 'Bright' },
    { id: 'echo', name: 'Echo', description: 'Deep' },
    { id: 'fable', name: 'Fable', description: 'Storytelling' },
    { id: 'nova', name: 'Nova', description: 'Clear' },
    { id: 'onyx', name: 'Onyx', description: 'Rich' },
    { id: 'sage', name: 'Sage', description: 'Wise' },
    { id: 'shimmer', name: 'Shimmer', description: 'Gentle' }
  ];
  
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
      // Check if this is an image generation assistant
      if (this.selectedAssistant.function === 'image') {
        try {
          const data = await post('draw', {}, {
            prompt: text,
            size: this.selectedImageSize,
            model: this.selectedAssistant.model || 'dall-e-3'
          });
          
          console.log("Received response from draw API:", data);
          
          // Add assistant response with image to messages
          runInAction(() => {
            this.messages.push({
              id: `assistant-${Date.now()}`,
              sender: 'assistant',
              text: data.url || data.image_url || data.data?.[0]?.url,
              type: 'image',
              timestamp: new Date().toISOString()
            });
            this.loading = false;
          });
        } catch (error) {
          console.error('Error generating image:', error);
          runInAction(() => {
            this.error = error.message;
            this.loading = false;
          });
        }
      } else if (this.selectedAssistant.function === 'video') {
        try {
          // Convert resolution to aspect ratio for jimeng API
          const aspectRatio = this.selectedVideoResolution === '1280x720' ? '16:9' :
                             this.selectedVideoResolution === '1024x1024' ? '1:1' : '16:9';
          
          // Start video generation with jimeng API
          const data = await post('jimeng', {}, {
            prompt: text,
            aspect_ratio: aspectRatio,
            duration: 5, // jimeng default duration
            model: 'jimeng-1.4'
          });
          
          console.log("Received response from jimeng API:", data);
          
          if (data.data?.task_id) {
            // Add a loading message to show generation is in progress
            const loadingMessageId = `assistant-${Date.now()}`;
            runInAction(() => {
              this.messages.push({
                id: loadingMessageId,
                sender: 'assistant',
                text: '正在生成视频，请稍候...',
                type: 'loading',
                timestamp: new Date().toISOString()
              });
            });
            
            // Poll for completion
            this.pollVideoCompletion(data.data.task_id, loadingMessageId);
          } else {
            throw new Error('No task ID received from jimeng API');
          }
        } catch (error) {
          console.error('Error generating video:', error);
          runInAction(() => {
            this.error = error.message;
            this.loading = false;
          });
        }
      } else if (this.selectedAssistant.function === 'tts') {
        try {
          const data = await post('tts', {}, {
            input: text,
            voice: this.selectedVoice,
            model: this.selectedAssistant.model || 'tts-1',
            response_format: 'mp3',
            speed: 1.0
          });
          
          console.log("Received response from TTS API:", data);
          
          // Create a blob URL from the base64 audio data
          const audioBlob = new Blob([Uint8Array.from(atob(data.body), c => c.charCodeAt(0))], { type: data.contentType || 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Add assistant response with audio to messages
          const audioMessage = {
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            text: text, // Keep the original text
            audioUrl: audioUrl,
            type: 'audio',
            timestamp: new Date().toISOString()
          };
          
          runInAction(() => {
            this.messages.push(audioMessage);
            this.loading = false;
          });
          
          // Auto-play the audio
          const audio = new Audio(audioUrl);
          audio.play().catch(error => {
            console.warn('Could not auto-play audio:', error);
          });
          
        } catch (error) {
          console.error('Error generating speech:', error);
          runInAction(() => {
            this.error = error.message;
            this.loading = false;
          });
        }
      } else if (this.selectedAssistant.function === 'workflow') {
        try {
          const data = await post('run_workflow', {}, {
            workflow_id: this.selectedAssistant.workflow_id,
            parameters: {
              [this.selectedAssistant.param]: text
            }
          });
          
          console.log("Received response from workflow API:", data);
          
          let messageText = data.result || data.output || JSON.stringify(data);
          
          // If assistant.html is not null, eval it as a function and run it with data
          if (this.selectedAssistant.html) {
            try {
              // Create a function from the html string and execute it with data
              const htmlFunction = new Function('x', `return \`${this.selectedAssistant.html}\``);
              messageText = htmlFunction(JSON.parse(data.data));
            } catch (htmlError) {
              console.error('Error executing HTML function:', htmlError);
              // Fall back to original message text if HTML function fails
            }
          }
          
          // Add assistant response to messages
          runInAction(() => {
            this.messages.push({
              id: `assistant-${Date.now()}`,
              sender: 'assistant',
              text: messageText,
              timestamp: new Date().toISOString()
            });
            this.loading = false;
          });
        } catch (error) {
          console.error('Error running workflow:', error);
          runInAction(() => {
            this.error = error.message;
            this.loading = false;
          });
        }
      } else {
        // Determine if we should use OpenRouter based on whether a model is selected
        const useOpenRouter = !!this.selectedAssistant.model;
        
        // Call OpenAI API with the assistant's prompt as system message
        try {
          const data = await post('chat', useOpenRouter ? { api: 'openrouter' } : {}, {
            model: this.selectedAssistant.model,
            messages: [
              { role: 'system', content: this.selectedAssistant.prompt || '' },
              ...this.messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text || ''
              }))
            ]
          });
          
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
      }
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
        console.error('Error in sendMessage:', error);
      });
    }
  }
  
  async pollVideoCompletion(task_id, loadingMessageId) {
    const maxAttempts = 60; // Poll for up to 5 minutes (60 * 5 seconds)
    let attempts = 0;
    
    const poll = async () => {
      try {
        attempts++;
        const result = await post('jimeng_query', {}, { taskId: task_id });
        
        console.log(`Polling attempt ${attempts}:`, result);
        
        if (result.data?.status === 'done' && result.data?.video_url) {
          // Video generation completed successfully - use the URL directly
          // External URLs (like from JiMeng API) are already signed and accessible
          runInAction(() => {
            // Find and update the loading message
            const messageIndex = this.messages.findIndex(msg => msg.id === loadingMessageId);
            if (messageIndex !== -1) {
              this.messages[messageIndex] = {
                ...this.messages[messageIndex],
                text: result.data.video_url,
                type: 'video'
              };
            }
            this.loading = false;
          });
        } else if (result.data?.status === 'failed') {
          // Video generation failed
          runInAction(() => {
            const messageIndex = this.messages.findIndex(msg => msg.id === loadingMessageId);
            if (messageIndex !== -1) {
              this.messages[messageIndex] = {
                ...this.messages[messageIndex],
                text: `视频生成失败: ${result.message || '未知错误'}`,
                type: 'error'
              };
            }
            this.loading = false;
            this.error = result.message || '视频生成失败';
          });
        } else if (attempts >= maxAttempts) {
          // Timeout
          runInAction(() => {
            const messageIndex = this.messages.findIndex(msg => msg.id === loadingMessageId);
            if (messageIndex !== -1) {
              this.messages[messageIndex] = {
                ...this.messages[messageIndex],
                text: '视频生成超时，请稍后重试',
                type: 'error'
              };
            }
            this.loading = false;
            this.error = '视频生成超时';
          });
        } else {
          // Still processing, continue polling
          setTimeout(poll, 5000); // Poll every 5 seconds
        }
      } catch (error) {
        console.error('Error polling video completion:', error);
        runInAction(() => {
          const messageIndex = this.messages.findIndex(msg => msg.id === loadingMessageId);
          if (messageIndex !== -1) {
            this.messages[messageIndex] = {
              ...this.messages[messageIndex],
              text: `查询视频状态失败: ${error.message}`,
              type: 'error'
            };
          }
          this.loading = false;
          this.error = error.message;
        });
      }
    };
    
    // Start polling after a short delay
    setTimeout(poll, 2000);
  }
  
  clearMessages() {
    // Clean up any blob URLs to prevent memory leaks
    this.messages.forEach(message => {
      if (message.audioUrl && message.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(message.audioUrl);
      }
    });
    this.messages = [];
    this.error = null;
  }
  
  setSelectedImageSize(size) {
    this.selectedImageSize = size;
  }
  
  setSelectedVideoResolution(resolution) {
    this.selectedVideoResolution = resolution;
  }
  
  setSelectedVoice(voice) {
    this.selectedVoice = voice;
  }
}

// Create and export a singleton instance
const assistantChatStore = new AssistantChatStore();
export default assistantChatStore;
