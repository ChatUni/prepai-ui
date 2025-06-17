import { observer } from 'mobx-react-lite';
import uiStore from '../../stores/uiStore';
import coursesStore from '../../stores/coursesStore';
import { useNavigate } from 'react-router-dom';
import languageStore from '../../stores/languageStore';
import seriesStore from '../../stores/seriesStore';
import SearchBar from './SearchBar';

const SeriesSearchBar = observer(() => {
  const { t } = languageStore;
  const navigate = useNavigate();

  const handleSearch = (e) => {
    uiStore.setSearchKeyword(e.target.value);
  };

  const handleInstructorFilter = (instructorId) => {
    const parsedId = instructorId === "" ? null : parseInt(instructorId);
    
    // Update UI store and trigger filtering
    uiStore.setSelectedInstructorId(parsedId);
    uiStore.setInstructorDropdownOpen(false);
    
    // Update courses store to trigger series filtering
    coursesStore.selectInstructor(parsedId);
    
    // Only navigate if not on exam or series page
    if (!window.location.pathname.includes('/exam') && !window.location.pathname.includes('/series')) {
      navigate(parsedId ? `/instructor/${parsedId}` : '/');
    }
  };

  const handleCategoryFilter = (category) => {
    // Update both stores to maintain consistency
    uiStore.setActiveCategory(category); // This will also close the dropdowns
  };

  const toggleInstructorDropdown = () => {
    uiStore.setInstructorDropdownOpen(!uiStore.isInstructorDropdownOpen);
  };

  const toggleCategoryDropdown = () => {
    uiStore.setCategoryDropdownOpen(!uiStore.isCategoryDropdownOpen);
  };

  const filters = [
    {
      key: 'instructor',
      isOpen: uiStore.isInstructorDropdownOpen,
      onToggle: toggleInstructorDropdown,
      onClose: () => uiStore.setInstructorDropdownOpen(false),
      selectedValue: uiStore.selectedInstructorId,
      displayValue: uiStore.selectedInstructorId
        ? coursesStore.instructors.find(i => i.id === uiStore.selectedInstructorId)?.name
        : t('search.allInstructors'),
      items: [
        { id: "", name: t('search.allInstructors') },
        ...coursesStore.instructors
      ],
      onSelect: handleInstructorFilter
    },
    {
      key: 'category',
      isOpen: uiStore.isCategoryDropdownOpen,
      onToggle: toggleCategoryDropdown,
      onClose: () => uiStore.setCategoryDropdownOpen(false),
      selectedValue: uiStore.activeCategory,
      displayValue: uiStore.activeCategory || t('search.allCategories'),
      items: [
        { value: "", label: t('search.allCategories') },
        ...seriesStore.uniqueCategories.map(category => ({
          value: category,
          label: category
        }))
      ],
      onSelect: handleCategoryFilter
    }
  ];

  return (
    <SearchBar
      searchValue={uiStore.searchKeyword}
      onSearchChange={handleSearch}
      searchPlaceholder={t('search.searchPlaceholder')}
      filters={filters}
    />
  );
});

export default SeriesSearchBar;
