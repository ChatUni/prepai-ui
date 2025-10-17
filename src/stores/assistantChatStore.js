import { makeAutoObservable, runInAction } from 'mobx';
import { post, get } from '../utils/db.js';
import assistantStore from './assistantStore.js';
import userStore from './userStore.js';
import { t } from './languageStore';

class AssistantChatStore {
  selectedAssistant = null;
  messages = [];
  loading = false;
  error = null;
  selectedVideoResolution = '1280x720';
  wf_params = {};
  
  constructor() {
    makeAutoObservable(this);
  }
  
  // Helper function to add a message to the chat
  addMessage = (messageData) => {
    runInAction(() => {
      this.messages.push({
        id: messageData.id || `${messageData.sender}-${Date.now()}`,
        sender: messageData.sender,
        text: messageData.text,
        type: messageData.type,
        audioUrl: messageData.audioUrl,
        timestamp: messageData.timestamp || new Date().toISOString(),
        ...messageData
      });
    });
  }
  
  // Helper function to update an existing message by ID
  updateMessage = (messageId, updates) => {
    runInAction(() => {
      const messageIndex = this.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        this.messages[messageIndex] = {
          ...this.messages[messageIndex],
          ...updates
        };
      }
    });
  }
  
  // Helper function to set error state and stop loading
  setError = (errorMessage) => {
    runInAction(() => {
      this.error = errorMessage;
      this.loading = false;
    });
  }
  
  // Helper function to set loading state
  setLoading = (loading) => {
    runInAction(() => {
      this.loading = loading;
    });
  }
  
  setSelectedAssistant(assistant) {
    this.selectedAssistant = assistant;
    
    // Clear previous messages
    this.clearMessages();
    
    // Initialize workflow parameters if this is a workflow assistant
    if (assistant && assistant.function === 'workflow') {
      this.initializeWorkflowParams();
    }
    
    // Add greeting message from assistant if available
    if (assistant && assistant.greeting) {
      this.addMessage({
        id: 'greeting',
        sender: 'assistant',
        text: assistant.greeting
      });
    }
  }
  
  // Initialize workflow parameters based on assistant configuration
  initializeWorkflowParams = async () => {
    if (!this.selectedAssistant || !this.selectedAssistant.param) {
      this.wf_params = {};
      return;
    }
    
    const params = {};
    
    // Process each parameter in the assistant's param object
    for (const [paramName, paramConfig] of Object.entries(this.selectedAssistant.param)) {
      if (typeof paramConfig === 'number') {
        // If it's a number (always 1 for now), it will be filled by ChatInput
        params[paramName] = null;
      } else if (typeof paramConfig === 'object' && paramConfig.type === 'number') {
        // Handle number type parameters
        params[paramName] = {
          ...paramConfig,
          value: paramConfig.default || paramConfig.min || 0
        };
      } else if (typeof paramConfig === 'object') {
        if (paramConfig.type === 'select' || paramConfig.type === 'radio') {
          // Handle select type parameters
          params[paramName] = {
            ...paramConfig,
            value: null,
            options: [],
            loading: true
          };
          
          // Load options
          try {
            let options = [];
            if (paramConfig.options.startsWith('[')) {
              // Parse JSON array
              options = JSON.parse(paramConfig.options);
            } else {
              // Call API
              const response = await get(paramConfig.options);
              options = response || [];
            }
            
            runInAction(() => {
              params[paramName].options = options;
              params[paramName].loading = false;
              params[paramName].value = params[paramName].default || (options.length > 0 ? options[0].value : '');
            });
          } catch (error) {
            console.error(`Error loading options for parameter ${paramName}:`, error);
            runInAction(() => {
              params[paramName].loading = false;
              params[paramName].options = [];
            });
          }
        } else {
          params[paramName] = paramConfig
        }
      }
    }
    
    runInAction(() => {
      this.wf_params = params;
    });
  }
  
  // Update workflow parameter value
  setWorkflowParam = (paramName, value) => {
    runInAction(() => {
      if (this.wf_params[paramName]) {
        if (typeof this.wf_params[paramName] === 'object') {
          this.wf_params[paramName].value = value;
        } else {
          this.wf_params[paramName] = value;
        }
      }
    });
  }
  
  async sendMessage(text) {
    if (!this.selectedAssistant) {
      console.error('No assistant selected');
      return;
    }
    
    // Collect any image data from workflow parameters
    let imageData = null;
    if (this.selectedAssistant.function === 'workflow') {
      for (const [paramName, paramConfig] of Object.entries(this.wf_params)) {
        if (paramConfig && paramConfig.type === 'image' && paramConfig.value) {
          imageData = {
            file: paramConfig.value,
            paramName: paramName
          };
          break; // Take the first image found
        }
      }
    }
    
    // Add user message to the chat
    this.addMessage({
      sender: 'user',
      text
    });
    
    // If there's an image, add it to the message
    if (imageData && imageData.file instanceof File) {
      this.addMessage({
        sender: 'user',
        type: 'image',
        url: URL.createObjectURL(imageData.file),
        file: imageData.file,
      });
    }
    
    this.setLoading(true);
    
    try {
      if (this.selectedAssistant.function === 'video') {
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
            this.addMessage({
              id: loadingMessageId,
              sender: 'assistant',
              text: '正在生成视频，请稍候...',
              type: 'loading'
            });
            
            // Poll for completion
            this.pollVideoCompletion(data.data.task_id, loadingMessageId);
          } else {
            throw new Error('No task ID received from jimeng API');
          }
        } catch (error) {
          console.error('Error generating video:', error);
          this.setError(error.message);
        }
      } else if (this.selectedAssistant.function === 'workflow') {
        try {
          // Build parameters object from wf_params and text input
          const parameters = {};
          
          // Process each parameter
          for (const [paramName, paramConfig] of Object.entries(this.selectedAssistant.param)) {
            if (typeof paramConfig === 'number') {
              // Use ChatInput text for number parameters
              parameters[paramName] = text;
            } else if (typeof paramConfig === 'object' && this.wf_params[paramName]) {
              if (this.wf_params[paramName].value !== null) {
                parameters[paramName] = this.wf_params[paramName].value;
              }
            }
          }
          
          if (this.selectedAssistant.model) parameters.model = this.selectedAssistant.model

          this.clearImageParams();

          const r = await post(
            'run_workflow',
            {
              workflow_id: this.selectedAssistant.workflow_id,
              usageType: assistantStore.getResult(this.selectedAssistant),
              userId: userStore.user.id
            },
            parameters
          );
          
          console.log("Received response from workflow API:", r);
          
          const result = this.selectedAssistant.result
          const isHtml = result.startsWith('<')
          const data = JSON.parse(r.data)
          let messageText = data.result || data.output;
          
          if (isHtml) {
            try {
              // Create a function from the html string and execute it with data
              const htmlFunction = new Function('x', `return \`${result}\``);
              messageText = htmlFunction(data);
            } catch (htmlError) {
              console.error('Error executing HTML function:', htmlError);
              // Fall back to original message text if HTML function fails
            }
          }
          
          // Add assistant response to messages
          this.addMessage({
            sender: 'assistant',
            isHtml,
            url: !isHtml ? messageText : undefined,
            text: messageText,
            type: isHtml ? 'html' : result
          });
        } catch (error) {
          console.error('Error running workflow:', error);
          this.addMessage({
            sender: 'assistant',
            isHtml: true,
            text: `<div style="color: red">${t('assistant.limit.error')}</div>`,
            type: 'html'
          });
        } finally {
          this.setLoading(false);
        }        
      } else {
        // Determine if we should use OpenRouter based on whether a model is selected
        const useOpenRouter = false; // !!this.selectedAssistant.model;
        
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
          this.addMessage({
            sender: 'assistant',
            text: data.choices[0].message.content
          });
          this.setLoading(false);
        } catch (error) {
          console.error(`Error sending message to ${useOpenRouter ? 'OpenRouter' : 'OpenAI'}:`, error);
          this.setError(error.message);
        }
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      this.setError(error.message);
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
          this.updateMessage(loadingMessageId, {
            text: result.data.video_url,
            type: 'video'
          });
          this.setLoading(false);
        } else if (result.data?.status === 'failed') {
          // Video generation failed
          this.updateMessage(loadingMessageId, {
            text: `视频生成失败: ${result.message || '未知错误'}`,
            type: 'error'
          });
          this.setError(result.message || '视频生成失败');
        } else if (attempts >= maxAttempts) {
          // Timeout
          this.updateMessage(loadingMessageId, {
            text: '视频生成超时，请稍后重试',
            type: 'error'
          });
          this.setError('视频生成超时');
        } else {
          // Still processing, continue polling
          setTimeout(poll, 5000); // Poll every 5 seconds
        }
      } catch (error) {
        console.error('Error polling video completion:', error);
        this.updateMessage(loadingMessageId, {
          text: `查询视频状态失败: ${error.message}`,
          type: 'error'
        });
        this.setError(error.message);
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
  
  setSelectedVideoResolution(resolution) {
    this.selectedVideoResolution = resolution;
  }
  
  // Clear image parameters from workflow params
  clearImageParams = () => {
    runInAction(() => {
      for (const [paramName, paramConfig] of Object.entries(this.wf_params)) {
        if (paramConfig && paramConfig.type === 'image') {
          paramConfig.value = null;
        }
      }
    });
  }
}

// Create and export a singleton instance
const assistantChatStore = new AssistantChatStore();
export default assistantChatStore;
