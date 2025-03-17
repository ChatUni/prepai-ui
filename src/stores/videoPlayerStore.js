import { makeObservable, observable, action, computed, runInAction } from 'mobx';

class VideoPlayerStore {
  // Video state
  videoElement = null;
  currentTime = 0;
  duration = 0;
  isPlaying = false;
  
  // Transcript data
  transcript = [];
  originalTranscriptFormat = null;
  
  constructor() {
    makeObservable(this, {
      videoElement: observable,
      currentTime: observable,
      duration: observable,
      isPlaying: observable,
      transcript: observable,
      originalTranscriptFormat: observable,
      
      setVideoElement: action,
      setCurrentTime: action,
      setDuration: action,
      setIsPlaying: action,
      setTranscript: action,
      
      currentSubtitle: computed,
      parseSrtTranscript: action
    });
  }
  
  setVideoElement = (element) => {
    // Clean up listeners from the previous element if any
    if (this.videoElement) {
      this.videoElement.removeEventListener('timeupdate', this.timeUpdateHandler);
      this.videoElement.removeEventListener('durationchange', this.durationChangeHandler);
      this.videoElement.removeEventListener('play', this.playHandler);
      this.videoElement.removeEventListener('pause', this.pauseHandler);
    }
    
    this.videoElement = element;
    
    // Add event listeners to track video time and state
    if (element) {
      // Arrow functions automatically bind to 'this' context
      this.timeUpdateHandler = this.handleTimeUpdate;
      this.durationChangeHandler = this.handleDurationChange;
      this.playHandler = this.handlePlay;
      this.pauseHandler = this.handlePause;
      
      element.addEventListener('timeupdate', this.timeUpdateHandler);
      element.addEventListener('durationchange', this.durationChangeHandler);
      element.addEventListener('play', this.playHandler);
      element.addEventListener('pause', this.pauseHandler);
      
      // Initialize currentTime from the element
      if (element.currentTime) {
        this.setCurrentTime(element.currentTime);
      }
    }
  };
  
  // Event handlers
  handleTimeUpdate = (e) => {
    this.setCurrentTime(e.target.currentTime);
  };
  
  handleDurationChange = (e) => {
    this.setDuration(e.target.duration);
  };
  
  handlePlay = () => {
    this.setIsPlaying(true);
  };
  
  handlePause = () => {
    this.setIsPlaying(false);
  };
  
  setCurrentTime = (time) => {
    this.currentTime = time;
  };
  
  setDuration = (duration) => {
    this.duration = duration;
  };
  
  setIsPlaying = (isPlaying) => {
    this.isPlaying = isPlaying;
  };
  
  setTranscript = (transcript, format = 'json') => {
    this.originalTranscriptFormat = format;
    
    if (format === 'srt') {
      this.parseSrtTranscript(transcript);
    } else {
      this.transcript = transcript;
    }
  };
  
  // Parse SRT format transcript
  parseSrtTranscript = (srtText) => {
    if (!srtText) {
      this.transcript = [];
      return;
    }
    
    // Split the SRT text into entries (separated by blank lines)
    const entries = srtText.trim().split(/\n\s*\n/);
    const parsedTranscript = [];
    
    for (const entry of entries) {
      const lines = entry.trim().split(/\n/);
      
      // Need at least 2 lines (time code and text)
      if (lines.length < 2) continue;
      
      // Find the timecode line (containing -->)
      const timecodeLineIndex = lines.findIndex(line => line.includes('-->'));
      if (timecodeLineIndex === -1) continue;
      
      // The ID is usually the first line, but we'll be flexible
      // and just look for the timecode line
      const timecode = lines[timecodeLineIndex];
      // Support both formats: 00:00:00,000 and 00:00:00.000
      const timeMatch = timecode.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/);
      
      if (!timeMatch) continue;
      
      // Convert SRT time format (00:00:00,000) to seconds
      const startTime = this.srtTimeToSeconds(timeMatch[1]);
      const endTime = this.srtTimeToSeconds(timeMatch[2]);
      
      // Get all text lines (everything after the timecode line)
      const text = lines.slice(timecodeLineIndex + 1).join(' ').trim();
      
      if (text) {
        parsedTranscript.push({
          id: lines[0], // Usually the first line is the ID
          text,
          startTime,
          endTime
        });
      }
    }
    
    // Sort by start time to ensure proper order
    this.transcript = parsedTranscript.sort((a, b) => a.startTime - b.startTime);
  };
  
  // Convert SRT time format (00:00:00,000 or 00:00:00.000) to seconds
  srtTimeToSeconds = (timeString) => {
    // Handle both comma and period as decimal separators
    const parts = timeString.split(/[,.]/);
    const time = parts[0];
    const milliseconds = parts[1];
    
    const [hours, minutes, seconds] = time.split(':').map(Number);
    
    return hours * 3600 + minutes * 60 + seconds + parseInt(milliseconds) / 1000;
  };
  
  // Get the currently active subtitle based on video time
  get currentSubtitle() {
    if (!this.transcript || this.transcript.length === 0) return null;
    
    if (this.originalTranscriptFormat === 'srt') {
      // For SRT format, use the start and end time
      return this.transcript.find(item =>
        this.currentTime >= item.startTime && this.currentTime <= item.endTime
      ) || this.findClosestSubtitle();
    } else {
      // For JSON format, use offset and duration
      return this.transcript.find(item => {
        const startTime = (item.offset || 0) / 1000;
        const endTime = startTime + (item.duration || 3000) / 1000;
        return this.currentTime >= startTime && this.currentTime <= endTime;
      }) || this.findClosestSubtitle();
    }
  }
  
  // Find the closest subtitle if we're between subtitles
  findClosestSubtitle = () => {
    if (!this.transcript || this.transcript.length === 0) return null;
    
    // If we're past the end of the last subtitle, return the last one
    const lastSubtitle = this.transcript[this.transcript.length - 1];
    if (this.originalTranscriptFormat === 'srt') {
      if (this.currentTime > lastSubtitle.endTime) return lastSubtitle;
      
      // Find the next subtitle that will appear
      return this.transcript.find(item => item.startTime > this.currentTime) || null;
    } else {
      const lastEndTime = (lastSubtitle.offset + lastSubtitle.duration) / 1000 || 0;
      if (this.currentTime > lastEndTime) return lastSubtitle;
      
      // Find the next subtitle that will appear
      return this.transcript.find(item => (item.offset / 1000) > this.currentTime) || null;
    }
  };
}

const videoPlayerStore = new VideoPlayerStore();
export default videoPlayerStore;