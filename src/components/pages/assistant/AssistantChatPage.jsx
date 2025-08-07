import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaDownload } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import ChatInput from '../../ui/ChatInput';
import assistantStore from '../../../stores/assistantStore';
import assistantChatStore from '../../../stores/assistantChatStore';
import Button from '../../ui/Button';
import { t } from '../../../stores/languageStore';
import LoadingState from '../../ui/LoadingState';
import FormSelect from '../../ui/FormSelect';
import FormInput from '../../ui/FormInput';
import FormRadio from '../../ui/FormRadio';
import ImageUpload from '../../ui/ImageUpload';

// Loading indicator with animated dots
const TypingIndicator = () => {
  return (
    <div className="flex justify-start mb-4">
      <div className="px-4 py-3 rounded-lg bg-gray-200 text-gray-800 rounded-bl-none">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
        </div>
      </div>
    </div>
  );
};

// Image message component
const ImageMessage = ({ message }) => (
  <div className={`max-w-[75%] ${message.sender === 'user' ? 'ml-auto' : 'mr-auto'}`}>
    <div className="inline-block">
      <img
        src={message.url}
        alt="Generated image"
        className="max-w-full h-auto rounded-lg"
        style={{ maxWidth: '300px', maxHeight: '300px' }}
      />
      <div className="text-xs mt-1 text-gray-500">
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
    </div>
  </div>
);

// Video message component
const VideoMessage = ({ message }) => (
  <div className={`max-w-[75%] w-full ${message.sender === 'user' ? 'ml-auto' : 'mr-auto'}`}>
    <div className="inline-block">
      <div className="relative rounded-lg overflow-hidden">
        <video
          src={message.url}
          controls
          className="w-full h-auto"
          crossOrigin="anonymous"
          onError={(e) => {
            console.warn('Video failed to load, likely due to CORS:', e);
            // Fallback: show a link to open in new tab
            e.target.style.display = 'none';
            const fallbackDiv = e.target.nextElementSibling;
            if (fallbackDiv) fallbackDiv.style.display = 'block';
          }}
        >
          Your browser does not support the video tag.
        </video>
        <div
          className="hidden bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"
        >
          <div className="flex flex-col items-center justify-center h-full">
            <a
              href={message.url}
              download
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FaDownload className="w-4 h-4 mr-2" />
              {t('menu.categories.assistant.downloadVideo')}
            </a>
          </div>
        </div>
      </div>
      <div className="text-xs mt-1 text-gray-500">
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
    </div>
  </div>
);

// Audio message component
const AudioMessage = ({ message }) => (
  <div className={`max-w-[75%] w-full ${message.sender === 'user' ? 'ml-auto' : 'mr-auto'}`}>
    <audio
      src={message.url}
      controls
      autoPlay
      className="w-full"
      preload="metadata"
    >
      Your browser does not support the audio element.
    </audio>
    <div className="text-xs mt-1 text-gray-500">
      {new Date(message.timestamp).toLocaleTimeString()}
    </div>
  </div>
);

// Text message component
const TextMessage = ({ message }) => (
  <div className={`max-w-[75%] ${message.sender === 'user' ? 'ml-auto' : 'mr-auto'}`}>
    <div className={`inline-block px-4 py-3 rounded-lg ${
      message.sender === 'user'
        ? 'bg-blue-500 text-white rounded-br-none'
        : 'bg-gray-200 text-gray-800 rounded-bl-none'
    }`}>
      <div className="text-sm whitespace-pre-wrap">
        {message.isHtml ? (
          <div dangerouslySetInnerHTML={{ __html: message.text }} />
        ) : (
          <ReactMarkdown>{message.text}</ReactMarkdown>
        )}
      </div>
      <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
    </div>
  </div>
);

// Message type selector component
const MessageContent = ({ message }) => {
  const messageTypeMap = {
    image: ImageMessage,
    video: VideoMessage,
    audio: AudioMessage
  };
  
  const MessageComponent = messageTypeMap[message.type] || TextMessage;
  return <MessageComponent message={message} />;
};

// Custom chat messages component for assistants
const AssistantChatMessages = observer(() => {
  const messagesEndRef = useRef(null);
  const messages = assistantChatStore.messages;
  const isLoading = assistantChatStore.loading;

  // Auto-scroll to bottom when new messages arrive or when loading state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoading]);

  const chatContent = (
    <div className="space-y-4 pt-4 px-4">
      {messages.map((message, index) => (
        <div
          key={message.id || index}
          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
        >
          <MessageContent message={message} />
        </div>
      ))}
      
      {/* Show typing indicator when waiting for assistant response */}
      {isLoading && <TypingIndicator />}
      
      <div ref={messagesEndRef} />
    </div>
  );

  return (
    <LoadingState
      isEmpty={messages.length === 0}
      customMessage={messages.length === 0 ? t('menu.assistant.noMessages') : null}
    >
      {chatContent}
    </LoadingState>
  );
});

// Video resolution selector component
const VideoResolutionSelector = observer(() => {
  const resolutions = [
    { size: '1280x720', label: '16:9', dimensions: '1280×720' },
    { size: '1920x1080', label: '16:9', dimensions: '1920×1080' },
    { size: '720x1280', label: '9:16', dimensions: '720×1280' },
    { size: '1080x1920', label: '9:16', dimensions: '1080×1920' }
  ];

  const getIconComponent = (size) => {
    const [width, height] = size.split('x').map(Number);
    if (height > width) {
      // Tall rectangle (portrait)
      return (
        <div className="w-3 h-5 border-2 border-current"></div>
      );
    } else {
      // Wide rectangle (landscape)
      return (
        <div className="w-5 h-3 border-2 border-current"></div>
      );
    }
  };

  return (
    <div className="grid grid-cols-4 gap-2 mt-4">
      {resolutions.map(({ size, label, dimensions }) => (
        <button
          key={size}
          onClick={() => assistantChatStore.setSelectedVideoResolution(size)}
          className={`flex flex-col items-center gap-1 px-1 py-2 rounded-lg border-2 transition-all ${
            assistantChatStore.selectedVideoResolution === size
              ? 'bg-blue-100 border-blue-500 text-blue-700'
              : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200 hover:border-gray-400'
          }`}
        >
          {getIconComponent(size)}
          <div className="text-xs font-medium">{label}</div>
          <div className="text-xs text-gray-500 leading-tight">{dimensions}</div>
        </button>
      ))}
    </div>
  );
});

const WorkflowParam = observer(({ paramName, paramConfig }) => {
  if (!paramConfig) return null;
  const handleChange = (value) => {
    assistantChatStore.setWorkflowParam(paramName, value);
  };

  const handleImageSelect = (data) => {
    // Store the file object for the workflow param
    if (data && data.file) {
      handleChange(data.file);
    }
  };

  if (paramConfig.type === 'number') {
    return (
      <div className="mt-2">
        <FormInput
          value={paramConfig.value || paramConfig.default || ''}
          onChange={handleChange}
          label={t(`params.${paramName}`)}
          type="number"
          min={paramConfig.min}
          max={paramConfig.max}
          defaultValue={paramConfig.default}
        />
      </div>
    );
  }

  if (paramConfig.type === 'radio') {
    return (
      <div className="mt-2">
        <FormRadio
          value={paramConfig.value || paramConfig.default}
          onChange={handleChange}
          options={paramConfig.options}
          label={t(`params.${paramName}`)}
        />
      </div>
    );
  }

  if (paramConfig.type === 'image') {
    return (
      <ImageUpload
        id={`workflow-param-${paramName}`}
        selectedFile={paramConfig.value}
        previewUrl={paramConfig.value && typeof paramConfig.value === 'string' ? paramConfig.value : null}
        onMediaSelect={handleImageSelect}
        label={paramConfig.title}
        type="image"
        hasTitle={!!paramConfig.title}
      />
    );
  }

  if (paramConfig.loading) {
    return (
      <div className="mt-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {paramName}
        </label>
        <div className="w-full p-2 border rounded bg-gray-100 text-gray-500">
          Loading options...
        </div>
      </div>
    );
  }

  return (
    <FormSelect
      value={paramConfig.value}
      onChange={handleChange}
      options={paramConfig.options}
      showSelectedIcon={false}
      displayMode={paramConfig.mode}
      cols={paramConfig.cols}
    />
  );
});

const AssistantChatPage = observer(() => {
  const { assistantId } = useParams();
  const navigate = useNavigate();
  
  // Find the selected assistant
  useEffect(() => {
    if (assistantStore.items.length && assistantId) {
      const assistant = assistantStore.items.find(
        a => a.id === parseInt(assistantId)
      );
      
      if (assistant) {
        assistantChatStore.setSelectedAssistant(assistant);
      } else {
        console.error(`Assistant with ID ${assistantId} not found`);
        navigate('/assistants');
      }
    }
  }, [assistantId, assistantStore.assistants, navigate]);
  
  // Handle message sending
  const handleSendMessage = (text) => {
    assistantChatStore.sendMessage(text);
  };
  
  // Go back to assistant selection
  const handleBack = () => {
    navigate('/assistants');
  };

  const errorContent = assistantStore.error && (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div className="text-gray-600 mt-2">{assistantStore.error}</div>
      <button
        onClick={() => assistantStore.fetchAssistants()}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
      >
        {t('menu.categories.assistant.retry')}
      </button>
    </div>
  );

  const mainContent = assistantChatStore.selectedAssistant && (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center p-4 border-b cursor-pointer hover:bg-gray-50"
        onClick={handleBack}
      >
        <img
          src={assistantChatStore.selectedAssistant.image}
          alt={assistantChatStore.selectedAssistant.name}
          className="w-8 h-8 rounded-full mr-4 object-cover"
        />
        <h1 className="text-xl font-semibold">{assistantChatStore.selectedAssistant.name}</h1>
      </div>
      
      {/* Chat messages area */}
      <div className="flex-grow overflow-y-auto">
        <AssistantChatMessages />
      </div>
      
      {/* Input area */}
      <div className="p-4 border-t">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={assistantChatStore.loading}
          placeholder={assistantChatStore.selectedAssistant?.placeholder || t('menu.categories.assistant.inputQuestion')}
        />
        {assistantChatStore.selectedAssistant?.function === 'video' && (
          <VideoResolutionSelector />
        )}
        {assistantChatStore.selectedAssistant?.function === 'workflow' && (
          <div>
            {Object.entries(assistantChatStore.wf_params).map(([paramName, paramConfig]) => (
              <WorkflowParam
                key={paramName}
                paramName={paramName}
                paramConfig={paramConfig}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
  
  return (
    <LoadingState
      isLoading={assistantStore.loading}
      isError={!!assistantStore.error}
      isEmpty={!assistantStore.loading && !assistantStore.error && !assistantChatStore.selectedAssistant}
      customMessage={
        assistantStore.loading ? t('menu.assistant.loading') :
        assistantStore.error ? t('menu.assistant.loadingFailed') :
        !assistantChatStore.selectedAssistant ? t('menu.categories.assistant.notFound') :
        null
      }
    >
      {assistantStore.error ? errorContent : mainContent}
    </LoadingState>
  );
});

export default AssistantChatPage;
