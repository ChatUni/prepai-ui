// This file contains browser-compatible utility functions for video transcript processing
// Server-side functions are moved to server/videoProcessing.js

// Helper functions to extract video IDs and generate playable URLs
export const getYoutubeId = (url) => {
  if (!url) return null;
  
  // Match YouTube URL patterns
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
};

// Helper function to extract Google Drive file ID from URL
export const getGoogleDriveId = (url) => {
  if (!url) return null;
  
  // Match Google Drive URL patterns
  // Examples:
  // https://drive.google.com/file/d/FILE_ID/view
  // https://drive.google.com/open?id=FILE_ID
  const patterns = [
    /\/file\/d\/([^/]+)/,  // Pattern for /file/d/ URLs
    /[?&]id=([^&]+)/       // Pattern for ?id= parameter
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Helper function to generate direct playable URL for Google Drive videos
export const getGoogleDriveDirectUrl = (url) => {
  const fileId = getGoogleDriveId(url);
  if (!fileId) return null;
  
  // Generate direct link using Google Drive's direct download URL
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${import.meta.env.VITE_GOOGLE_API_KEY}`;
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
    
    // In a real implementation with Groq API, we would use:
    /*
    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You're a helpful AI that summarizes video content..."
        },
        {
          role: "user",
          content: `Please summarize the following transcript text from a video:\n\n${transcriptText}`
        }
      ],
      model: "llama-3.1-70b-versatile",
      temperature: 0.3,
      max_tokens: 1500,
    });
    
    return completion.choices[0].message.content;
    */
    
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
    
    // Fallback: if no structured topics found, extract important words
    if (topics.length === 0) {
      const words = summaryText.split(/\s+/);
      const stopWords = ['the', 'and', 'a', 'to', 'of', 'in', 'is', 'that', 'it', 'with', 'for', 'as', 'are', 'on', 'be', 'this', 'was', 'by'];
      const wordFrequency = {};
      
      words.forEach(word => {
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
        if (cleanWord && cleanWord.length > 3 && !stopWords.includes(cleanWord)) {
          wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + 1;
        }
      });
      
      topics = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([word]) => word);
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
      keyPoints: keyPoints.length > 0 ? keyPoints : extractKeyPoints(summaryText),
      wordCount,
      readingTime,
      difficulty
    };
  } catch (error) {
    console.error('Error parsing summary:', error);
    return defaultSummary;
  }
};

// Helper function to extract key sentences from text
export const extractKeyPoints = (text, maxPoints = 5) => {
  // Split text into sentences
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 10);
  
  // Simple algorithm to find important sentences (longer sentences with important keywords)
  const keywordWeights = {
    important: 3,
    key: 3,
    main: 3,
    significant: 3,
    essential: 3,
    crucial: 3,
    primary: 2,
    major: 2,
    vital: 2,
    critical: 2,
    fundamental: 2,
    basic: 1,
    central: 1,
    core: 1,
    principal: 1
  };
  
  // Score sentences based on length and keywords
  const scoredSentences = sentences.map(sentence => {
    const words = sentence.toLowerCase().split(/\s+/);
    let score = Math.min(words.length / 5, 3); // Length score capped at 3
    
    // Add scores for keywords
    for (const word of words) {
      if (keywordWeights[word]) {
        score += keywordWeights[word];
      }
    }
    
    return { text: sentence.trim(), score };
  });
  
  // Sort by score and take top N
  return scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPoints)
    .map(item => item.text);
};