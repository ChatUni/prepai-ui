import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import Button from './Button';
import languageStore from '../../stores/languageStore';

const ChatInput = observer(({ onSendMessage, disabled = false, placeholder }) => {
  const { t } = languageStore;
  // Use provided placeholder or default to translation
  const inputPlaceholder = placeholder || t('chat.inputPlaceholder');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={inputPlaceholder}
        className="flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={disabled}
      />
      <Button
        onClick={handleSubmit}
        className={!disabled && message.trim() ? 'bg-green-600' : 'bg-gray-400 cursor-not-allowed'}
        disabled={disabled || !message.trim()}
      >
        {t('chat.send')}
      </Button>
    </form>
  );
});

export default ChatInput;