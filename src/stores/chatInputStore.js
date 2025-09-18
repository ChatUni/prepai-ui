import { makeObservable, observable, action, computed } from 'mobx';
import voiceRecordingStore from './voiceRecordingStore';

class ChatInputStore {
  message = '';

  constructor() {
    makeObservable(this, {
      message: observable,
      displayMessage: computed,
      setMessage: action,
      clearMessage: action,
      handleVoiceResult: action
    });

    // Listen for voice recording results
    this.setupVoiceRecordingListener();
  }

  get displayMessage() {
    return this.message;
  }

  setMessage(message) {
    this.message = message;
  }

  clearMessage() {
    this.message = '';
  }

  setupVoiceRecordingListener() {
    // This will be called when voice recording completes
    const originalSetRecordedText = voiceRecordingStore.setRecordedText.bind(voiceRecordingStore);
    voiceRecordingStore.setRecordedText = (text) => {
      originalSetRecordedText(text);
      this.handleVoiceResult(text);
    };
  }

  handleVoiceResult(text) {
    if (text && text.trim()) {
      this.setMessage(text.trim());
    }
  }
}

export default new ChatInputStore();