import React from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import coursesStore from '../../stores/coursesStore';
import routeStore from '../../stores/routeStore';

const SeriesCard = observer(({ series }) => {
  const navigate = useNavigate();
  const courseCount = coursesStore.courses.filter(course => course.series_id === series.id).length;
  
  // Default image if none is provided
  const coverImage = series.cover || 'https://via.placeholder.com/300x200?text=Series';
  
  const handleSeriesClick = (e) => {
    // Ensure the event doesn't propagate to parent elements
    if (e) e.stopPropagation();
    
    // Use the improved routeStore method for navigation
    routeStore.navigateToSeries(series.id, navigate);
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
            alt={series.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <h3 className="text-white font-bold truncate">{series.name}</h3>
          </div>
        </div>
        
        <div className="p-3">
          <div className="flex items-center mb-2">
            {series.instructor_avatar ? (
              <img
                src={series.instructor_avatar}
                alt={series.instructor_name}
                className="w-6 h-6 rounded-full mr-2"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
                <span className="text-xs text-gray-600">{series.instructor_name?.[0]?.toUpperCase()}</span>
              </div>
            )}
            <span className="text-sm text-gray-600 dark:text-gray-300">{series.instructor_name}</span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 h-10 mb-2">
            {series.desc || 'No description available'}
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