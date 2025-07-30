import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatInput from '../../ui/ChatInput';
import assistantStore from '../../../stores/assistantStore';
import assistantChatStore from '../../../stores/assistantChatStore';
import Button from '../../ui/Button';
import { t } from '../../../stores/languageStore';
import LoadingState from '../../ui/LoadingState';

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
          <div className={message.sender === 'user' ? 'pr-0' : 'pl-0'}>
            {message.type === 'image' ? (
              <div className="inline-block">
                <img
                  src={message.text}
                  alt="Generated image"
                  className="max-w-full h-auto rounded-lg"
                  style={{ maxWidth: '300px', maxHeight: '300px' }}
                />
                <div className="text-xs mt-1 text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ) : message.type === 'video' ? (
              <div className="inline-block">
                <div className="relative rounded-lg overflow-hidden" style={{ maxWidth: '400px', maxHeight: '300px' }}>
                  <video
                    src={message.text}
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
                    style={{ minHeight: '200px' }}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-gray-600 mb-2">Video cannot be embedded due to CORS restrictions</div>
                      <a
                        href={message.text}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open Video in New Tab
                      </a>
                    </div>
                  </div>
                </div>
                <div className="text-xs mt-1 text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ) : message.type === 'audio' ? (
              <div className="inline-block">
                <div className="bg-gray-200 text-gray-800 rounded-lg p-4 max-w-sm">
                  <div className="text-sm mb-3 whitespace-pre-wrap">{message.text}</div>
                  <audio
                    src={message.audioUrl}
                    controls
                    className="w-full"
                    preload="metadata"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
                <div className="text-xs mt-1 text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <div className={`inline-block px-4 py-3 rounded-lg max-w-[75%] ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}>
                <div
                  className="text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: message.text }}
                />
                <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
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

// Resolution selector component
const ResolutionSelector = observer(() => {
  const resolutions = [
    { size: '256x256', label: '1:1', dimensions: '256×256' },
    { size: '512x512', label: '1:1', dimensions: '512×512' },
    { size: '1024x1024', label: '1:1', dimensions: '1024×1024' },
    { size: '1792x1024', label: '16:9', dimensions: '1792×1024' },
    { size: '1024x1792', label: '9:16', dimensions: '1024×1792' }
  ];

  const getIconComponent = (size) => {
    const [width, height] = size.split('x').map(Number);
    if (width === height) {
      // Square
      return (
        <div className="w-5 h-5 border-2 border-current"></div>
      );
    } else if (height > width) {
      // Tall rectangle
      return (
        <div className="w-3 h-5 border-2 border-current"></div>
      );
    } else {
      // Wide rectangle
      return (
        <div className="w-5 h-3 border-2 border-current"></div>
      );
    }
  };

  return (
    <div className="grid grid-cols-5 gap-2 mt-4">
      {resolutions.map(({ size, label, dimensions }) => (
        <button
          key={size}
          onClick={() => assistantChatStore.setSelectedImageSize(size)}
          className={`flex flex-col items-center gap-1 px-1 py-2 rounded-lg border-2 transition-all ${
            assistantChatStore.selectedImageSize === size
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

// Voice selector component for TTS
const VoiceSelector = observer(() => {
  return (
    <div className="grid grid-cols-5 gap-2 mt-4">
      {assistantChatStore.voices.map(({ id, name, description }) => (
        <button
          key={id}
          onClick={() => assistantChatStore.setSelectedVoice(id)}
          className={`flex flex-col items-center gap-1 px-2 py-3 rounded-lg border-2 transition-all ${
            assistantChatStore.selectedVoice === id
              ? 'bg-blue-100 border-blue-500 text-blue-700'
              : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200 hover:border-gray-400'
          }`}
        >
          <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-current"></div>
          </div>
          <div className="text-xs font-medium">{name}</div>
          <div className="text-xs text-gray-500 leading-tight">{description}</div>
        </button>
      ))}
    </div>
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
          placeholder={t('menu.categories.assistant.inputQuestion')}
        />
        {assistantChatStore.selectedAssistant?.function === 'image' && (
          <ResolutionSelector />
        )}
        {assistantChatStore.selectedAssistant?.function === 'video' && (
          <VideoResolutionSelector />
        )}
        {assistantChatStore.selectedAssistant?.function === 'tts' && (
          <VoiceSelector />
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
