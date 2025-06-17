import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import CourseList from './pages/series/CourseList.jsx';
import SeriesSearchBar from './ui/SeriesSearchBar';
import uiStore from '../stores/uiStore';
import { getApiBaseUrl } from '../config.js';
import LoadingState from './ui/LoadingState';

const FavoritesPage = observer(() => {
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/favorites?userId=${uiStore.userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch favorites');
        }
        
        const data = await response.json();
        setFavorites(data);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        
        setError('Failed to load favorites. Please try again later.');
        setFavorites([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFavorites();
  }, [uiStore.favoriteCourseIds.size]);
  
  // Filter favorites based on search keyword and course type
  const filteredFavorites = favorites.filter(course => {
    const searchKeyword = uiStore.searchKeyword.toLowerCase();
    const courseTypeFilter = uiStore.courseTypeFilter;
    
    // Filter by course type (video vs document)
    const matchesCourseType = course.isVideo === courseTypeFilter;
    
    // Filter by search keyword
    const matchesSearch = !searchKeyword ||
      course.title.toLowerCase().includes(searchKeyword) ||
      course.instructor.toLowerCase().includes(searchKeyword) ||
      (course.keywords && course.keywords.toLowerCase().includes(searchKeyword));
    
    return matchesSearch && matchesCourseType;
  });

  return (
    <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Filter Bar */}
      <div className="mb-4 md:mb-6">
        <SeriesSearchBar />
      </div>
      
      <LoadingState
        isLoading={isLoading}
        isError={!!error}
        isEmpty={!isLoading && !error && filteredFavorites.length === 0}
        customMessage={
          isLoading ? "Loading your favorites..." :
          error ? error :
          filteredFavorites.length === 0 ? (uiStore.searchKeyword ? '没有找到匹配的收藏课程' : '您还没有收藏任何课程') :
          null
        }
      >
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-6">我的收藏 ({filteredFavorites.length})</h2>
          <CourseList
            title=""
            courses={filteredFavorites}
          />
        </div>
      </LoadingState>
    </div>
  );
});

export default FavoritesPage;
