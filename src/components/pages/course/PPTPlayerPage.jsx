import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import coursesStore from '../../../stores/coursesStore';
import languageStore from '../../../stores/languageStore';
import LoadingState from '../../ui/LoadingState';

const PPTPlayerPage = observer(() => {
  const { t } = languageStore;
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(20);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Reference to the iframe element
  const iframeRef = useRef(null);

  useEffect(() => {
    const loadCourse = async () => {
      setLoading(true);
      try {
        // Find the course in the store
        const foundCourse = coursesStore.courses.find(c => c.id === parseInt(courseId));
        
        if (!foundCourse) {
          throw new Error('Course not found');
        }
        
        // Check if it's a document course
        if (foundCourse.isVideo) {
          throw new Error('Not a document course');
        }
        
        setCourse(foundCourse);
      } catch (err) {
        console.error('Error loading course:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadCourse();
  }, [courseId]);
  
  // Effect to synchronize the iframe content with the current slide
  useEffect(() => {
    if (iframeRef.current && course?.video_url) {
      const iframe = iframeRef.current;
      
      // For embedded PowerPoint viewers, we can try to send a message to change slides
      // This works for some embedded viewers that support postMessage API
      try {
        iframe.contentWindow.postMessage({
          type: 'setSlide',
          slideNumber: currentSlide
        }, '*');
        
        console.log(`Changed to slide ${currentSlide}`);
      } catch (err) {
        console.error('Failed to change slide via postMessage:', err);
      }
    }
  }, [currentSlide, course]);
  
  // Add keyboard navigation for slides
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSlide();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'Home') {
        setCurrentSlide(1);
      } else if (e.key === 'End') {
        setCurrentSlide(totalSlides);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSlide, totalSlides]); // Depend on currentSlide and totalSlides to ensure the latest state is used

  const handleBack = () => {
    navigate(-1);
  };

  const nextSlide = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 1) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  const toggleHelp = () => {
    setShowHelp(!showHelp);
  };

  const errorContent = error && (
    <button onClick={handleBack} className="text-blue-500 mb-4 flex items-center">
      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
      {t('menu.categories.back')}
    </button>
  );

  const mainContent = (
    <div className="flex flex-col py-6 pb-20 md:pb-6 px-6 h-full w-full">
      <button onClick={handleBack} className="text-blue-500 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        {t('menu.categories.back')}
      </button>
      
      <div className="bg-gray-100 w-full flex-grow flex flex-col items-center justify-center relative">
        {/* PowerPoint display */}
        {course?.slides && course.slides[currentSlide - 1] ? (
          <img
            src={course.slides[currentSlide - 1]}
            alt={`Slide ${currentSlide}`}
            className="w-full h-full object-contain"
          />
        ) : course?.video_url ? (
          <iframe
            ref={iframeRef}
            src={course.video_url.includes('docs.google.com') ?
              course.video_url :
              `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(course.video_url)}`}
            className="w-full h-full border-0"
            frameBorder="0"
            allowFullScreen
          ></iframe>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-8xl font-bold text-gray-300">Slide {currentSlide}</div>
            <p className="text-gray-500 mt-4">PowerPoint placeholder</p>
          </div>
        )}
      </div>
    </div>
  );

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
        {error ? errorContent : mainContent}
      </LoadingState>
    </div>
  );
});

export default PPTPlayerPage;
