import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import Button from './Button';
import Icon from './Icon';
import VoiceWaveBar from './VoiceWaveBar';
import languageStore from '../../stores/languageStore';
import chatInputStore from '../../stores/chatInputStore';
import voiceRecordingStore from '../../stores/voiceRecordingStore';
import { FiMic } from 'react-icons/fi';

const ChatInput = observer(({ onSendMessage, disabled = false, placeholder }) => {
  const { t } = languageStore;
  // Use provided placeholder or default to translation
  const inputPlaceholder = placeholder || t('chat.inputPlaceholder');

  useEffect(() => {
    // Clear any previous recorded text when component mounts
    voiceRecordingStore.clearRecordedText();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (chatInputStore.message.trim()) {
      onSendMessage(chatInputStore.message);
      chatInputStore.clearMessage();
    }
  };

  const handleMouseDown = () => {
    if (!disabled && voiceRecordingStore.canRecord) {
      voiceRecordingStore.startRecording();
    }
  };

  const handleMouseUp = () => {
    if (voiceRecordingStore.isRecording) {
      voiceRecordingStore.stopRecording();
    }
  };

  const handleMouseLeave = () => {
    if (voiceRecordingStore.isRecording) {
      voiceRecordingStore.stopRecording();
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    handleMouseDown();
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleMouseUp();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      {/* Microphone Button */}
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={disabled || !voiceRecordingStore.isSupported}
        className={`w-11 h-10 rounded-full flex items-center justify-center transition-colors ${
          voiceRecordingStore.isRecording
            ? 'bg-red-500 text-white'
            : voiceRecordingStore.canRecord && !disabled
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        title={
          !voiceRecordingStore.isSupported
            ? 'Voice recording not supported'
            : voiceRecordingStore.isRecording
            ? 'Release to stop recording'
            : 'Hold to record voice message'
        }
      >
        <Icon icon={FiMic} size={20} />
      </button>

      {/* Input or Wave Bar */}
      {voiceRecordingStore.isRecording ? (
        <div className="flex-grow border border-gray-300 rounded-full bg-gray-50">
          <VoiceWaveBar />
        </div>
      ) : (
        <input
          type="text"
          value={chatInputStore.message}
          onChange={(e) => chatInputStore.setMessage(e.target.value)}
          placeholder={inputPlaceholder}
          className="flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
      )}

      <Button
        onClick={handleSubmit}
        className={!disabled && chatInputStore.message.trim() ? 'bg-green-600' : 'bg-gray-400 cursor-not-allowed'}
        disabled={disabled || !chatInputStore.message.trim()}
      >
        {t('chat.send')}
      </Button>
    </form>
  );
});

export default ChatInput;