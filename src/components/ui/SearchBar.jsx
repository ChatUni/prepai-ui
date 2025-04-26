import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import uiStore from '../../stores/uiStore';
import coursesStore from '../../stores/coursesStore';
import { useNavigate } from 'react-router-dom';
import languageStore from '../../stores/languageStore';

const SearchBar = observer(() => {
  const { t } = languageStore;
  const navigate = useNavigate();
  const instructorDropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        instructorDropdownRef.current &&
        !instructorDropdownRef.current.contains(event.target) &&
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        uiStore.closeAllDropdowns();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    uiStore.setSearchKeyword(e.target.value);
  };

  const handleInstructorFilter = (instructorId) => {
    const parsedId = instructorId === "" ? null : parseInt(instructorId);
    uiStore.setSelectedInstructorId(parsedId);
    uiStore.setInstructorDropdownOpen(false);
    
    // Only navigate if not on exam or series page
    if (!window.location.pathname.includes('/exam') && !window.location.pathname.includes('/series')) {
      navigate(parsedId ? `/instructor/${parsedId}` : '/');
    }
  };

  const handleCategoryFilter = (category) => {
    // Update both stores to maintain consistency
    uiStore.setActiveCategory(category); // This will also close the dropdowns
    seriesStore.setSelectedCategory(category, true);
  };

  const toggleInstructorDropdown = () => {
    uiStore.setInstructorDropdownOpen(!uiStore.isInstructorDropdownOpen);
  };

  const toggleCategoryDropdown = () => {
    uiStore.setCategoryDropdownOpen(!uiStore.isCategoryDropdownOpen);
  };

  return (
    <div className="flex flex-row items-center w-full max-w-3xl gap-1 sm:gap-2">
      <div className="relative shrink-0" ref={instructorDropdownRef}>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg flex items-center whitespace-nowrap min-w-max text-sm sm:text-base w-full sm:w-auto justify-between border-r border-blue-600"
          onClick={toggleInstructorDropdown}
        >
          <span className="truncate max-w-[200px]">
            {uiStore.selectedInstructorId
              ? coursesStore.instructors.find(i => i.id === uiStore.selectedInstructorId)?.name
              : t('search.allInstructors')}
          </span>
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={uiStore.isInstructorDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
            />
          </svg>
        </button>
        
        {uiStore.isInstructorDropdownOpen && (
          <div
            className="absolute z-10 mt-1 bg-white rounded-md shadow-lg whitespace-nowrap"
          >
            <ul className="py-1 max-h-60 overflow-y-auto w-max min-w-full">
              <li
                className={`px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-blue-100 cursor-pointer text-sm sm:text-base ${!uiStore.selectedInstructorId ? 'bg-blue-50' : ''}`}
                onClick={() => handleInstructorFilter("")}
              >
                {t('search.allInstructors')}
              </li>
              {coursesStore.instructors.map(instructor => (
                <li
                  key={instructor.id}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-blue-100 cursor-pointer text-sm sm:text-base ${uiStore.selectedInstructorId === instructor.id ? 'bg-blue-50' : ''}`}
                  onClick={() => handleInstructorFilter(instructor.id)}
                >
                  {instructor.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="relative shrink-0 -ml-[1px] mr-1 sm:mr-2" ref={categoryDropdownRef}>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg flex items-center whitespace-nowrap min-w-max text-sm sm:text-base w-full sm:w-auto justify-between"
          onClick={toggleCategoryDropdown}
        >
          <span className="truncate max-w-[200px]">
            {uiStore.activeCategory || t('search.allCategories')}
          </span>
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={uiStore.isCategoryDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
            />
          </svg>
        </button>
        
        {uiStore.isCategoryDropdownOpen && (
          <div
            className="absolute z-10 mt-1 bg-white rounded-md shadow-lg whitespace-nowrap"
          >
            <ul className="py-1 max-h-60 overflow-y-auto w-max min-w-full">
              <li
                className={`px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-blue-100 cursor-pointer text-sm sm:text-base ${!uiStore.activeCategory ? 'bg-blue-50' : ''}`}
                onClick={() => handleCategoryFilter("")}
              >
                {t('search.allCategories')}
              </li>
              {coursesStore.uniqueCategories.map(category => (
                <li
                  key={category}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-blue-100 cursor-pointer text-sm sm:text-base ${uiStore.activeCategory === category ? 'bg-blue-50' : ''}`}
                  onClick={() => handleCategoryFilter(category)}
                >
                  {category}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="relative flex-1 flex min-w-0">
        <div className="absolute top-0 bottom-0 left-0 flex items-center pl-2 sm:pl-3 pointer-events-none">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-full focus:outline-none"
          placeholder={t('search.searchPlaceholder')}
          value={uiStore.searchKeyword}
          onChange={handleSearch}
        />
      </div>
    </div>
  );
});

export default SearchBar;
