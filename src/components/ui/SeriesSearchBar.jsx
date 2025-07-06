import { observer } from 'mobx-react-lite';
import uiStore from '../../stores/uiStore';
import coursesStore from '../../stores/coursesStore';
import { useNavigate } from 'react-router-dom';
import { t } from '../../stores/languageStore';
import seriesStore from '../../stores/seriesStore';
import SearchBar from './SearchBar';

const SeriesSearchBar = observer(() => {
  const navigate = useNavigate();

  const handleInstructorFilter = (instructorId) => {
    const parsedId = instructorId === null ? null : parseInt(instructorId);
    
    // Update UI store and trigger filtering
    uiStore.setSelectedInstructorId(parsedId);
    
    // Update courses store to trigger series filtering
    coursesStore.selectInstructor(parsedId);
    
    // Only navigate if not on exam or series page
    if (!window.location.pathname.includes('/exam') && !window.location.pathname.includes('/series')) {
      navigate(parsedId ? `/instructor/${parsedId}` : '/');
    }
  };

  const handleCategoryFilter = (category) => {
    // Update both stores to maintain consistency
    uiStore.setActiveCategory(category);
  };

  const filters = [
    {
      key: 'instructor',
      selectedField: 'selectedInstructorId',
      optionsField: 'instructors',
      optionsStore: coursesStore,
      allLabel: t('search.allInstructors'),
      onSelect: handleInstructorFilter
    },
    {
      key: 'category',
      selectedField: 'activeCategory',
      optionsField: 'uniqueCategories',
      optionsStore: seriesStore,
      allLabel: t('search.allCategories'),
      onSelect: handleCategoryFilter
    }
  ];

  return (
    <SearchBar
      store={uiStore}
      filters={filters}
    />
  );
});

export default SeriesSearchBar;
