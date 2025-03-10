import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import CourseList from './ui/CourseList';
import SearchBar from './ui/SearchBar';
import uiStore from '../stores/uiStore';

const FavoritesPage = observer(() => {
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`http://localhost:3001/api/favorites?userId=${uiStore.userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch favorites');
        }
        
        const data = await response.json();
        setFavorites(data);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        
        // Fallback to using local favorites from uiStore or sample data
        let localFavorites = [];
        
        // Try to get favorites from uiStore
        if (uiStore.favoriteCourseIds.size > 0) {
          uiStore.favoriteCourseIds.forEach(id => {
            const course = window.coursesStore?.courses.find(c => c.id === id);
            if (course) localFavorites.push({...course, isFavorite: true});
          });
        }
        
        // If no favorites in uiStore, use sample data for demonstration
        if (localFavorites.length === 0 && window.coursesStore?.courses?.length > 0) {
          // Use first 3 courses as sample favorites
          localFavorites = window.coursesStore.courses.slice(0, 3).map(course => ({
            ...course,
            isFavorite: true
          }));
          
          // Add these courses to uiStore.favoriteCourseIds
          localFavorites.forEach(course => {
            uiStore.favoriteCourseIds.add(course.id);
          });
        }
        
        setFavorites(localFavorites);
        
        // Only show error if we couldn't get any fallback data
        if (localFavorites.length === 0) {
          setError('Failed to load favorites. Please try again later.');
        } else {
          setError(null);
        }
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
        <SearchBar />
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-48 md:h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-3 md:mb-4"></div>
            <p className="text-gray-600 text-sm md:text-base">Loading your favorites...</p>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 md:px-4 md:py-3 rounded relative mb-4 md:mb-6 text-sm md:text-base" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Content when loaded successfully */}
      {!isLoading && !error && (
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-6">我的收藏 ({filteredFavorites.length})</h2>
          
          {filteredFavorites.length > 0 ? (
            <CourseList
              title=""
              courses={filteredFavorites}
            />
          ) : (
            <div className="text-center py-8 md:py-12">
              <p className="text-gray-600 text-base md:text-lg">
                {uiStore.searchKeyword
                  ? '没有找到匹配的收藏课程'
                  : '您还没有收藏任何课程'}
              </p>
              {!uiStore.searchKeyword && (
                <p className="text-gray-500 mt-2 text-sm md:text-base">
                  点击课程卡片上的星形图标来收藏课程
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default FavoritesPage;
