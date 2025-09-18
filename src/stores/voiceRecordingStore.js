import { makeObservable, observable, action, computed } from 'mobx';

class VoiceRecordingStore {
  isRecording = false;
  isSupported = false;
  recognition = null;
  recordedText = '';
  error = null;

  constructor() {
    makeObservable(this, {
      isRecording: observable,
      isSupported: observable,
      recordedText: observable,
      error: observable,
      canRecord: computed,
      startRecording: action,
      stopRecording: action,
      setRecordedText: action,
      setError: action,
      clearError: action,
      clearRecordedText: action
    });

    this.initializeSpeechRecognition();
  }

  get canRecord() {
    return this.isSupported && !this.isRecording;
  }

  initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'zh-CN';

      this.recognition.onstart = () => {
        this.isRecording = true;
        this.clearError();
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.setRecordedText(transcript);
      };

      this.recognition.onerror = (event) => {
        this.setError(`Speech recognition error: ${event.error}`);
        this.isRecording = false;
      };

      this.recognition.onend = () => {
        this.isRecording = false;
      };

      this.isSupported = true;
    } else {
      this.isSupported = false;
      this.setError('Speech recognition not supported in this browser');
    }
  }

  startRecording() {
    if (this.canRecord && this.recognition) {
      this.clearRecordedText();
      this.clearError();
      try {
        this.recognition.start();
      } catch (error) {
        this.setError('Failed to start recording');
        this.isRecording = false;
      }
    }
  }

  stopRecording() {
    if (this.isRecording && this.recognition) {
      this.recognition.stop();
    }
  }

  setRecordedText(text) {
    this.recordedText = text;
  }

  setError(error) {
    this.error = error;
  }

  clearError() {
    this.error = null;
  }

  clearRecordedText() {
    this.recordedText = '';
  }
}

export default new VoiceRecordingStore();