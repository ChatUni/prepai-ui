import React from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import coursesStore from '../../stores/coursesStore';
import routeStore from '../../stores/routeStore';

const SeriesCard = observer(({ series }) => {
  const navigate = useNavigate();
  
  // Validate series object
  if (!series || typeof series !== 'object') {
    console.error('Invalid series object:', series);
    return null;
  }

  // Ensure we have a valid ID (either id or _id)
  const seriesId = series.id || series._id;
  if (!seriesId) {
    console.error('Series missing ID:', series);
    return null;
  }

  const courseCount = coursesStore.courses.filter(course =>
    course?.series?.id === seriesId || course?.series?._id === seriesId
  ).length;
  
  // Ensure we have valid string values
  const name = typeof series.name === 'string' ? series.name : '';
  const desc = typeof series.desc === 'string' ? series.desc : '';
  const cover = typeof series.cover === 'string' ? series.cover : '';
  
  // Default image if none is provided
  const coverImage = cover || 'https://via.placeholder.com/300x200?text=Series';
  
  // Validate instructor object
  const instructor = series.instructor && typeof series.instructor === 'object' ? {
    id: series.instructor.id || series.instructor._id,
    name: typeof series.instructor.name === 'string' ? series.instructor.name : '',
    image: typeof series.instructor.image === 'string' ? series.instructor.image : ''
  } : null;

  const handleSeriesClick = (e) => {
    // Ensure the event doesn't propagate to parent elements
    if (e) e.stopPropagation();
    
    // Use the improved routeStore method for navigation
    routeStore.navigateToSeries(seriesId, navigate);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div
        onClick={(e) => handleSeriesClick(e)}
        className="cursor-pointer"
      >
        <div className="relative pb-[56.25%]"> {/* 16:9 aspect ratio */}
          <img
            src={coverImage}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <h3 className="text-white font-bold truncate">{name}</h3>
          </div>
        </div>
        
        <div className="p-3">
          <div className="flex items-center mb-2">
            {instructor?.image ? (
              <img
                src={instructor.image}
                alt={instructor.name}
                className="w-6 h-6 rounded-full mr-2"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
                <span className="text-xs text-gray-600">{instructor?.name?.[0]?.toUpperCase() || '?'}</span>
              </div>
            )}
            <span className="text-sm text-gray-600 dark:text-gray-300">{instructor?.name || 'Unknown Instructor'}</span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 h-10 mb-2">
            {desc || 'No description available'}
          </p>
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-blue-600 dark:text-blue-400">
              {courseCount} 个课程
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SeriesCard;