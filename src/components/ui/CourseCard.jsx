import { observer } from 'mobx-react-lite';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import uiStore from '../../stores/uiStore';
import languageStore from '../../stores/languageStore';

const CourseCard = observer(({ course }) => {
  const { t } = languageStore;
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Check if the course is favorited
  const isFavorite = uiStore.favoriteCourseIds.has(course.id);
  
  // Handle favorite toggle
  const handleFavoriteToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    await uiStore.toggleFavorite(course.id);
    setIsLoading(false);
  };
  
  // Handle card click to navigate to video player or PPT player
  const handleCardClick = () => {
    if (course.isVideo) {
      navigate(`/video/${course.id}`);
    } else {
      // For PPT/documents, navigate to the PPT player page
      navigate(`/ppt/${course.id}`);
    }
  };

  // Handle practice button click
  const handlePracticeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/exam/questions/${course.id}`);
  };
  
  // Parse keywords from the comma-separated string
  const keywords = course.keywords ? course.keywords.split(',') : [];
  
  return (
    <div
      className="flex flex-col w-full relative group cursor-pointer mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Course Image */}
      <div className="bg-amber-300 overflow-hidden aspect-video relative shadow-sm">
        <img
          src={course.image || "https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Course"}
          alt={course.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Duration Badge or Format Badge */}
        <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs">
          {course.isVideo ? (
            course.duration || '00:00'
          ) : (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              {t('course.pptFormat')}
            </div>
          )}
        </div>
        
        {/* Action Buttons - Only visible on hover/touch */}
        <div className={`absolute top-1 right-1 sm:top-2 sm:right-2 flex gap-1.5 sm:gap-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100`}>
          {/* Practice Button */}
          <button
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-md"
            onClick={handlePracticeClick}
            aria-label={t('course.practiceQuestions')}
          >
            <svg
              className="w-3.5 h-3.5 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </button>

          {/* Favorite Button */}
          <button
            className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full shadow-md ${isFavorite ? 'bg-red-50' : 'bg-white bg-opacity-80'}`}
            onClick={handleFavoriteToggle}
            disabled={isLoading}
            aria-label={isFavorite ? t('course.removeFromFavorites') : t('course.addToFavorites')}
          >
          {isFavorite ? (
            // Red filled star for favorites
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          ) : (
            // Empty heart for non-favorites
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          )}
          </button>
        </div>
      </div>
      
      {/* Course Details */}
      <div className="p-3">
        {/* Course Title */}
        <h3 className="font-medium text-sm sm:text-base line-clamp-2">{course.title}</h3>
        
        {/* Course Instructor */}
        <div className="flex items-center mt-1">
          {course.instructor?.iconUrl ? (
            <img
              src={course.instructor.iconUrl}
              alt={course.instructor?.name}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full mr-1.5"
            />
          ) : (
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-300 mr-1.5 flex items-center justify-center">
              <span className="text-xs text-gray-600">
                {course.instructor?.name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          <p className="text-gray-600 text-xs sm:text-sm">{course.instructor?.name}</p>
        </div>
        
        {/* Keywords - Show on all screens now */}
        <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
          {keywords.slice(0, 2).map((keyword, index) => (
            <span
              key={`${course.id}-keyword-${index}`}
              className="bg-gray-100 text-gray-600 text-[10px] sm:text-xs px-1.5 py-0.5 rounded"
            >
              {keyword}
            </span>
          ))}
          {keywords.length > 2 && (
            <span className="text-[10px] sm:text-xs text-gray-500">
              {t('course.moreKeywords', { count: keywords.length - 2 })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export default CourseCard;
