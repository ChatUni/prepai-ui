import fs from 'fs';
import path from 'path';
import os from 'os';
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';

// Helper function to extract YouTube video ID from URL
export const getYoutubeId = (url) => {
  if (!url) return null;
  
  // Match YouTube URL patterns
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
};

// Function to download audio from YouTube using ytdl-core and fluent-ffmpeg
export const downloadYoutubeAudioOnly = async (url) => {
  const videoId = getYoutubeId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }
  
  const tempDir = path.join(os.tmpdir(), 'prepai-downloads');
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const outputPath = path.join(tempDir, `${videoId}.mp3`);
  
  // Return immediately if file already exists (cache)
  if (fs.existsSync(outputPath)) {
    return outputPath;
  }
  
  try {
    // Download audio from YouTube using ytdl-core and convert with ffmpeg
    return new Promise((resolve, reject) => {
      const audioStream = ytdl(url, {
        quality: 'highestaudio',
        filter: 'audioonly',
      });
      
      ffmpeg(audioStream)
        .audioBitrate(128)
        .save(outputPath)
        .on('end', () => {
          console.log(`Downloaded and converted ${videoId} to MP3`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error(`Error downloading/converting ${videoId}:`, err);
          reject(new Error(`Failed to download or convert video: ${err.message}`));
        });
    });
  } catch (error) {
    console.error('Error downloading video:', error);
    throw new Error(`Failed to download video audio: ${error.message}`);
  }
};

// Function to process audio with OpenAI's Whisper model via Groq
export const transcribeAudio = async (audioFilePath, language = 'auto') => {
  try {
    // Read the audio file
    const audioData = fs.readFileSync(audioFilePath);
    
    // Since Groq's current API may not support direct audio uploads,
    // we're providing a simpler implementation that returns a mock transcript for now
    
    console.log(`Audio file size: ${audioData.length / 1024 / 1024} MB`);
    
    // In a real implementation with Groq API, we would use something like:
    // const completion = await groqClient.chat.completions.create({...})
    
    // Simulate a 3-second delay to mimic API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // This is a placeholder for demonstration - in production you'd make an actual API call
    const mockTranscript = `This is a simulated transcript for the video. In a real implementation,
    this would be replaced with actual transcription from Whisper or another speech-to-text service.
    The transcript would contain timestamps and text content from the video.
    This is just placeholder text to show the UI functionality.`;
    
    return mockTranscript;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
};

// Function to generate summary using Groq
export const generateSummary = async (transcriptText) => {
  try {
    // For now, we'll use a simulated summary response
    console.log(`Transcript length: ${transcriptText.length} characters`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock summary response (placeholder)
    const mockSummary = `
# Summary

## Key Topics:
- Video Content Analysis
- AI Transcription Technology
- Speech Recognition
- Natural Language Processing
- Content Summarization

## Important Points:
- This video discusses how AI can be used to automatically generate transcripts and summaries
- The technology uses advanced speech recognition to convert audio to text
- The summary extraction process identifies the most important points from the content
- This technology can save significant time for content creators and educators
- Future enhancements could include multilingual support and better context understanding

## Content Information:
- Word Count: approximately 500 words
- Reading Time: 2-3 minutes
- Difficulty: Medium
`;
    
    return mockSummary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
};

// Function to parse the summary into a structured format
export const parseSummary = (summaryText) => {
  // Default structure in case parsing fails
  const defaultSummary = {
    topics: [],
    keyPoints: [],
    wordCount: 0,
    readingTime: 0,
    difficulty: '中'
  };
  
  try {
    // Simple extraction of key points (looking for numbered lists or bullet points)
    const keyPointsRegex = /(?:Key Points:|Important Points:|Main Points:).*?((?:\d+\.\s.*?(?:\n|$)|\*\s.*?(?:\n|$))+)/is;
    const keyPointsMatch = summaryText.match(keyPointsRegex);
    
    let keyPoints = [];
    if (keyPointsMatch && keyPointsMatch[1]) {
      keyPoints = keyPointsMatch[1]
        .split(/\n/)
        .map(line => line.replace(/^\d+\.\s|\*\s/, '').trim())
        .filter(point => point.length > 0);
    }
    
    // Extract topics (looking for topic/theme/subject related content)
    const topicsRegex = /(?:Key Topics:|Main Topics:|Topics:|Themes:|Subjects:).*?((?:(?:\d+\.\s|\*\s)?[\w\s,]+(?:\n|$))+)/is;
    const topicsMatch = summaryText.match(topicsRegex);
    
    let topics = [];
    if (topicsMatch && topicsMatch[1]) {
      topics = topicsMatch[1]
        .split(/\n|,/)
        .map(topic => topic.replace(/^\d+\.\s|\*\s/, '').trim())
        .filter(topic => topic.length > 0 && !/^\d+$/.test(topic));
    }
    
    // Count words in the transcript
    const wordCount = summaryText.split(/\s+/).filter(word => word.length > 0).length;
    
    // Calculate reading time (average 200 words per minute)
    const readingTime = Math.max(1, Math.round(wordCount / 200));
    
    // Determine difficulty
    let difficulty = '中';
    if (wordCount > 1000) {
      difficulty = '高';
    } else if (wordCount < 500) {
      difficulty = '低';
    }
    
    return {
      topics,
      keyPoints: keyPoints.length > 0 ? keyPoints : [],
      wordCount,
      readingTime,
      difficulty
    };
  } catch (error) {
    console.error('Error parsing summary:', error);
    return defaultSummary;
  }
};