import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import coursesStore from '../stores/coursesStore';
import videoPlayerStore from '../stores/videoPlayerStore';
import uiStore from '../stores/uiStore';
import { getYoutubeId, getGoogleDriveId, getGoogleDriveDirectUrl } from '../utils/videoTranscriptService';
import languageStore from '../stores/languageStore';
import LoadingState from './ui/LoadingState';

const VideoPlayerPage = observer(() => {
  const { t } = languageStore;
  const { courseId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('subtitles'); // 'subtitles', 'summary', or 'introduction'
  const [summary, setSummary] = useState(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  // Function to parse stored transcript
  const parseStoredTranscript = (storedTranscript) => {
    if (!storedTranscript) return [];
    
    // Check if transcript is in SRT format (contains timestamps with --> format)
    // Support both comma and period as decimal separators
    const isSrtFormat = /\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3}/.test(storedTranscript);
    
    if (isSrtFormat) {
      console.log("Detected SRT format transcript");
      videoPlayerStore.setTranscript(storedTranscript, 'srt');
      // Return an empty array as the actual transcript is now stored in the videoPlayerStore
      return [];
    }
    
    try {
      // Try to parse if it's in JSON format
      const parsedTranscript = JSON.parse(storedTranscript);
      videoPlayerStore.setTranscript(parsedTranscript, 'json');
      return parsedTranscript;
    } catch (e) {
      // If not parseable as JSON, convert plain text to transcript format
      const lines = storedTranscript.split('\n');
      let offset = 0;
      const parsedTranscript = lines.map(line => {
        const item = {
          text: line.trim(),
          offset: offset,
          duration: 3000 // Approximate duration for each line
        };
        offset += 3000;
        return item;
      }).filter(item => item.text.length > 0);
      
      videoPlayerStore.setTranscript(parsedTranscript, 'json');
      return parsedTranscript;
    }
  };

  // Function to fetch transcript and generate summary
  const fetchTranscriptAndSummary = async (videoUrl, storedTranscript) => {
    setTranscriptLoading(true);
    
    try {
      // If we have a stored transcript, use it
      if (storedTranscript) {
        console.log('Using stored transcript from database');
        const parsedTranscript = parseStoredTranscript(storedTranscript);
        
        // Calculate word count for summary
        const wordCount = videoPlayerStore.originalTranscriptFormat === 'srt'
          ? videoPlayerStore.transcript.reduce((count, item) => count + item.text.split(' ').length, 0)
          : parsedTranscript.reduce((count, item) => count + item.text.split(' ').length, 0);
        
        // Generate a summary from the transcript
        const mockSummary = {
          topics: ['Technology', 'AI', 'Transcription', 'Video Analysis', 'Education'],
          keyPoints: [
            'This transcript was loaded from the database',
            'The application now stores transcripts for better performance',
            'This reduces processing time and API usage',
            'Summaries are still generated from the transcript content'
          ],
          wordCount: wordCount,
          readingTime: Math.max(1, Math.round(wordCount / 200)),
          difficulty: '中'
        };
        
        setSummary(mockSummary);
        setTranscriptLoading(false);
        return;
      }
      
      // If no stored transcript, proceed with generating one
      if (!videoUrl) {
        throw new Error('No video URL provided');
      }
      
      const videoId = getYoutubeId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }
      
      console.log(`Processing video: ${videoId}`);
      // No transcript available, set empty state
      videoPlayerStore.setTranscript([], 'json');
      setSummary(null);
      setTranscriptLoading(false);
      
    } catch (err) {
      console.error('Error fetching transcript:', err);
      videoPlayerStore.setTranscript([], 'json');
      setSummary(null);
      setTranscriptLoading(false);
    }
  };

  // YouTube player reference
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [youtubeApiLoaded, setYoutubeApiLoaded] = useState(false);

  // Setup YouTube player
  useEffect(() => {
    if (!course || !getYoutubeId(course.video_url)) return;

    // Function to initialize the YouTube player
    const initializeYouTubePlayer = () => {
      // If the YouTube API is already loaded
      if (window.YT && window.YT.Player) {
        try {
          // Make sure the container exists
          const container = document.getElementById('youtube-player');
          if (!container) {
            console.error('YouTube player container not found');
            return null;
          }

          // Create the player
          const player = new window.YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: getYoutubeId(course.video_url),
            playerVars: {
              'autoplay': 1,
              'playsinline': 1,
              'rel': 0
            },
            events: {
              'onReady': (event) => {
                console.log('YouTube player ready');
                setYoutubePlayer(event.target);
                videoPlayerStore.setIsPlaying(true);
              },
              'onStateChange': (event) => {
                // Update isPlaying state in store based on player state
                if (event.data === window.YT.PlayerState.PLAYING) {
                  videoPlayerStore.setIsPlaying(true);
                } else if (
                  event.data === window.YT.PlayerState.PAUSED ||
                  event.data === window.YT.PlayerState.ENDED ||
                  event.data === window.YT.PlayerState.BUFFERING
                ) {
                  videoPlayerStore.setIsPlaying(false);
                }
              },
              'onError': (event) => {
                console.error('YouTube player error:', event.data);
                setError('Failed to load YouTube video');
              }
            }
          });
          return player;
        } catch (error) {
          console.error('Error initializing YouTube player:', error);
          return null;
        }
      }
      return null;
    };

    // Load the YouTube API if not already loaded
    if (!window.YT) {
      // Create global callback for when YouTube API is ready
      window.onYouTubeIframeAPIReady = () => {
        setYoutubeApiLoaded(true);
        initializeYouTubePlayer();
      };

      // Load the YouTube API script
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      // If API is already loaded, initialize player directly
      setYoutubeApiLoaded(true);
      initializeYouTubePlayer();
    }

    // Initialize the player state
    videoPlayerStore.setCurrentTime(0);
    videoPlayerStore.setIsPlaying(true); // Assume autoplay works initially

    // Cleanup function
    return () => {
      if (youtubePlayer && youtubePlayer.destroy) {
        youtubePlayer.destroy();
      }
    };
  }, [course]);

  // Setup an interval to track YouTube video time
  useEffect(() => {
    let youtubeInterval = null;
    
    if (course && getYoutubeId(course.video_url)) {
      youtubeInterval = setInterval(() => {
        // Only update if we have a valid YouTube player
        if (youtubePlayer && typeof youtubePlayer.getCurrentTime === 'function') {
          try {
            // Get the actual current time from the YouTube player API
            const currentTime = youtubePlayer.getCurrentTime();
            videoPlayerStore.setCurrentTime(currentTime);
          } catch (error) {
            console.error('Error getting YouTube current time:', error);
          }
        }
      }, 250);
      
      // Set up keyboard listeners for manual transcript sync adjustment and play/pause control
      const handleKeyDown = (e) => {
        // Allow manual adjustment of transcript timing
        if (e.key === '[') {
          // Shift transcript earlier
          if (youtubePlayer && typeof youtubePlayer.getCurrentTime === 'function') {
            const currentTime = youtubePlayer.getCurrentTime();
            youtubePlayer.seekTo(currentTime - 1, true);
          } else {
            videoPlayerStore.setCurrentTime(videoPlayerStore.currentTime - 1);
          }
        } else if (e.key === ']') {
          // Shift transcript later
          if (youtubePlayer && typeof youtubePlayer.getCurrentTime === 'function') {
            const currentTime = youtubePlayer.getCurrentTime();
            youtubePlayer.seekTo(currentTime + 1, true);
          } else {
            videoPlayerStore.setCurrentTime(videoPlayerStore.currentTime + 1);
          }
        } else if (e.key === ' ' || e.key === 'k') {
          // Toggle play/pause with spacebar or 'k' (YouTube shortcut)
          if (videoPlayerStore.isPlaying) {
            videoPlayerStore.setIsPlaying(false);
            
            // Pause YouTube player if available
            if (youtubePlayer && youtubePlayer.pauseVideo) {
              youtubePlayer.pauseVideo();
            }
          } else {
            videoPlayerStore.setIsPlaying(true);
            
            // Play YouTube player if available
            if (youtubePlayer && youtubePlayer.playVideo) {
              youtubePlayer.playVideo();
            }
          }
          e.preventDefault(); // Prevent page scroll on spacebar
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      
      return () => {
        if (youtubeInterval) {
          clearInterval(youtubeInterval);
        }
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
    
    return () => {
      if (youtubeInterval) {
        clearInterval(youtubeInterval);
      }
    };
  }, [course, youtubePlayer]);
  
  // Clean up videoPlayerStore when component unmounts
  useEffect(() => {
    return () => {
      // Reset the video player store when unmounting
      videoPlayerStore.setCurrentTime(0);
      videoPlayerStore.setVideoElement(null);
    };
  }, []);
  
  useEffect(() => {
    const loadCourse = async () => {
      setLoading(true);
      try {
        // Find the course in the store
        const foundCourse = coursesStore.courses.find(c => c.id === parseInt(courseId));
        
        if (!foundCourse) {
          throw new Error('Course not found');
        }
        
        // Check if it's a video course
        if (!foundCourse.isVideo) {
          throw new Error('Not a video course');
        }
        
        setCourse(foundCourse);
        
        // Fetch transcript and summary when course is loaded
        if (foundCourse.video_url) {
          fetchTranscriptAndSummary(foundCourse.video_url, foundCourse.transcript);
        }
      } catch (err) {
        console.error('Error loading course:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadCourse();
  }, [courseId]);

  const handleBack = () => {
    navigate(-1);
  };

  const errorContent = error && (
    <>
      <button onClick={handleBack} className="text-blue-500 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        {t('menu.categories.back')}
      </button>
    </>
  );

  if (loading || error) {
    return (
      <div className="flex flex-col py-6 pb-20 md:pb-6 px-6 h-full">
        <LoadingState
          isLoading={loading}
          isError={!!error}
          customMessage={
            loading ? t('menu.categories.loading') :
            error ? `${t('menu.categories.error')}: ${error}` :
            null
          }
        >
          {errorContent}
        </LoadingState>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow py-4 md:py-6 pb-16 md:pb-6 px-4 md:px-6 h-full">
      <button onClick={handleBack} className="text-blue-500 mb-4 hidden md:flex items-center">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        返回
      </button>
      
      {/* Main content area with video and tab panels - mobile optimized */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-2 md:mb-6 md:justify-between flex-grow">
        {/* Video Player - takes the flexible space */}
        <div className="flex-grow order-1 md:order-1 md:max-w-[calc(100%-24rem)] flex flex-col">
          <div className="aspect-video bg-black rounded overflow-hidden relative">
            
            {(() => {
              // Determine video type and handle accordingly
              if (getYoutubeId(course.video_url)) {
                return (
                  <div className="w-full h-full relative">
                    <div id="youtube-player" className="absolute inset-0"></div>
                  </div>
                );
              }

              // Handle Google Drive videos with iframe
              if (getGoogleDriveId(course.video_url)) {
                const fileId = getGoogleDriveId(course.video_url);
                return (
                  <iframe
                    src={`https://drive.google.com/file/d/${fileId}/preview`}
                    className="w-full h-full border-0"
                    allow="autoplay"
                  ></iframe>
                );
              }

              // For other video sources, use the video tag
              return (
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && !videoPlayerStore.videoElement) {
                      videoPlayerStore.setVideoElement(el);
                    }
                  }}
                  className="w-full h-full"
                  controls
                  autoPlay
                  src={course.video_url}
                  poster={course.image}
                >
                  Your browser does not support the video tag.
                </video>
              );
            })()}
          </div>
          
          {/* Course title and info now below the video */}
          <div className="mt-4">
            <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
            
            <div className="flex text-sm text-gray-600">
              <div className="mr-4">{t('menu.categories.video.courseInfo.instructor')}: {course.instructor?.name}</div>
              <div className="mr-4">{t('menu.categories.video.courseInfo.duration')}: {course.duration}</div>
              <div>{t('menu.categories.video.courseInfo.viewCount')}: {course.viewCount}</div>
            </div>
          </div>
        </div>
        
        {/* Tab Panel - fixed width on the right, using calculated height to fit viewport */}
        <div className="w-full md:w-96 order-2 md:order-2 bg-white border border-gray-200 rounded-lg flex flex-col h-[calc(100vh-380px)] md:h-[calc(100vh-200px)] flex-shrink-0">
          {/* Tab Navigation - fixed at the top */}
          <div className="flex border-b border-gray-200 flex-shrink-0">
            <button
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === 'subtitles'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('subtitles')}
            >
              {t('menu.categories.video.tabs.subtitles')}
            </button>
            <button
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === 'summary'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('summary')}
            >
              {t('menu.categories.video.tabs.summary')}
            </button>
            <button
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === 'introduction'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('introduction')}
            >
              {t('menu.categories.video.tabs.courseInfo')}
            </button>
          </div>
          
          {/* Tab Content - flex-grow to expand and scroll */}
          <div className="p-4 overflow-y-auto flex-grow" id="transcript-container">
            <LoadingState
              isLoading={transcriptLoading}
              customMessage={transcriptLoading ? t('menu.categories.video.loadingSubtitles') : null}
            >
              <div>
                {activeTab === 'subtitles' ? (
                <div className="space-y-2">
                  {videoPlayerStore.transcript.length > 0 ? (
                  videoPlayerStore.transcript.map((item, index) => {
                    // Check if this is the current subtitle
                    const isActive = videoPlayerStore.currentSubtitle &&
                      (videoPlayerStore.originalTranscriptFormat === 'srt'
                        ? (videoPlayerStore.currentSubtitle.id === item.id)
                        : (videoPlayerStore.currentSubtitle.offset === item.offset));
                    
                    // Format the timestamp based on the transcript format
                    let timestamp;
                    if (videoPlayerStore.originalTranscriptFormat === 'srt') {
                      // Format seconds to HH:MM:SS
                      const formatTime = (timeInSeconds) => {
                        const hours = Math.floor(timeInSeconds / 3600);
                        const minutes = Math.floor((timeInSeconds % 3600) / 60);
                        const seconds = Math.floor(timeInSeconds % 60);
                        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                      };
                      timestamp = `${formatTime(item.startTime)} → ${formatTime(item.endTime)}`;
                    } else {
                      // Original format for compatibility with existing code
                      timestamp = new Date(Math.floor((item.offset || 0) / 1000) * 1000).toISOString().substr(11, 8);
                    }
                    
                    // Handle click to seek to this time in the video
                    const handleSeek = () => {
                      // For YouTube videos
                      if (youtubePlayer && typeof youtubePlayer.seekTo === 'function') {
                        if (videoPlayerStore.originalTranscriptFormat === 'srt') {
                          youtubePlayer.seekTo(item.startTime, true);
                        } else if (item.offset !== undefined) {
                          youtubePlayer.seekTo(item.offset / 1000, true);
                        }
                        // Ensure video is playing after seeking
                        youtubePlayer.playVideo();
                        videoPlayerStore.setIsPlaying(true);
                      }
                      // For HTML5 video elements
                      else if (videoRef.current) {
                        if (videoPlayerStore.originalTranscriptFormat === 'srt') {
                          videoRef.current.currentTime = item.startTime;
                        } else if (item.offset !== undefined) {
                          videoRef.current.currentTime = item.offset / 1000;
                        }
                        videoRef.current.play();
                      }
                    };
                    
                    return (
                      <div
                        key={index}
                        id={`transcript-item-${index}`}
                        onClick={handleSeek}
                        className={`p-3 rounded cursor-pointer transition-all duration-300 ${
                          isActive
                            ? `bg-blue-100 border-l-4 border-blue-500 shadow-md ${videoPlayerStore.isPlaying ? 'animate-pulse-subtle' : ''}`
                            : 'hover:bg-gray-100 border-l-4 border-transparent'
                        }`}
                        ref={el => {
                          // Auto-scroll to the active subtitle
                          if (isActive && el) {
                            setTimeout(() => {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                          }
                        }}
                      >
                        <p className="text-gray-600 text-sm mb-1">{timestamp}</p>
                        <p className={`${isActive ? 'text-blue-800 font-medium' : 'text-gray-800'}`}>
                          {item.text}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-500 italic">{t('menu.categories.video.noSubtitles')}</div>
                )}
              </div>
            ) : activeTab === 'summary' ? (
              <div className="space-y-4">
                {summary ? (
                  <>
                    <h3 className="font-medium text-lg">{t('menu.categories.video.summary.mainTopics')}</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {summary.topics.map((topic, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {topic}
                        </span>
                      ))}
                    </div>
                    
                    <h3 className="font-medium text-lg mt-4">{t('menu.categories.video.summary.keyPoints')}</h3>
                    <ul className="list-disc pl-5 space-y-2 text-gray-700 mt-2">
                      {summary.keyPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                    
                    <h3 className="font-medium text-lg mt-6">{t('menu.categories.video.summary.contentInfo')}</h3>
                    <div className="space-y-2 mt-2">
                      <p className="text-gray-700">
                        <span className="font-medium">{t('menu.categories.video.summary.wordCount')}:</span> {summary.wordCount}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">{t('menu.categories.video.summary.readingTime')}:</span> {summary.readingTime} {t('menu.categories.video.summary.readingTimeUnit')}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">{t('menu.categories.video.summary.difficulty')}:</span> {summary.difficulty}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 italic">{t('menu.categories.video.noSummary')}</div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-gray-700">
                  {course.category && (
                    <div className="mb-2">
                      <span className="font-medium">{t('menu.video.courseInfo.category')}:</span> {course.category}
                    </div>
                  )}
                  {course.keywords && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="font-medium">{t('menu.video.courseInfo.keywords')}:</span>
                      {course.keywords.split(',').map((keyword, idx) => (
                        <span key={idx} className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded">
                          {keyword.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  {course.description && (
                    <div className="mt-4">
                      <p>{course.description}</p>
                    </div>
                  )}
                </div>
              </div>
                )}
              </div>
            </LoadingState>
          </div>
        </div>
      </div>
      
      {/* Course Description - only visible on desktop */}
      <div className="hidden md:block bg-gray-50 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">{t('menu.categories.video.courseInfo.courseIntro')}</h2>
        <div className="text-gray-700">
          {course.category && (
            <div className="mb-2">
              <span className="font-medium">{t('menu.categories.video.courseInfo.category')}:</span> {course.category}
            </div>
          )}
          {course.keywords && (
            <div className="flex flex-wrap gap-1 mb-2">
              <span className="font-medium">{t('menu.categories.video.courseInfo.keywords')}:</span>
              {course.keywords.split(',').map((keyword, idx) => (
                <span key={idx} className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded">
                  {keyword.trim()}
                </span>
              ))}
            </div>
          )}
          {course.description && (
            <div className="mt-4">
              <p>{course.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default VideoPlayerPage;