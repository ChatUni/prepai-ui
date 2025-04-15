import { observer } from 'mobx-react-lite';
import uiStore from '../../stores/uiStore';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import languageStore from '../../stores/languageStore';

const LeftMenu = observer(({ onItemClick }) => {
  const t = languageStore.t;
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState(null);
  
  // Initialize expanded section based on active category
  useEffect(() => {
    if (uiStore.activeCategory.includes(t('menu.categories.video'))) {
      setExpandedSection(t('menu.categories.videoCourses'));
    } else if (uiStore.activeCategory.includes(t('menu.categories.document'))) {
      setExpandedSection(t('menu.categories.documentCourses'));
    }
  }, []);
  
  const getMenuItems = () => {
    if (uiStore.activeNavItem === t('menu.categories.testing')) {
      return [
        { id: 'exam', label: t('menu.categories.testing'), category: t('menu.categories.testing'), clickable: false }
      ];
    }
    
    return [
      { id: 'series', label: t('menu.categories.seriesCourses'), category: t('menu.categories.seriesCourses'), highlight: true, clickable: true, isMainCategory: true },
      { id: 'video', label: t('menu.categories.videoCourses'), category: t('menu.categories.videoCourses'), highlight: true, clickable: true, isVideo: true, isMainCategory: true },
      { id: 'video-recommended', label: t('menu.categories.recommended'), category: `Video Recommended`, clickable: true, isVideo: true, parentCategory: t('menu.categories.videoCourses') },
      { id: 'video-collection', label: t('menu.categories.myFavorites'), category: `Video Favorites`, clickable: true, isVideo: true, parentCategory: t('menu.categories.videoCourses') },
      { id: 'video-history', label: t('menu.categories.playHistory'), category: `Video Play History`, clickable: true, isVideo: true, parentCategory: t('menu.categories.videoCourses') },
      // Document course section
      { id: 'document', label: t('menu.categories.documentCourses'), category: t('menu.categories.documentCourses'), highlight: true, clickable: true, isVideo: false, isMainCategory: true },
      { id: 'document-recommended', label: t('menu.categories.recommended'), category: `Document Recommended`, clickable: true, isVideo: false, parentCategory: t('menu.categories.documentCourses') },
      { id: 'document-collection', label: t('menu.categories.myFavorites'), category: `Document Favorites`, clickable: true, isVideo: false, parentCategory: t('menu.categories.documentCourses') },
      { id: 'document-history', label: t('menu.categories.playHistory'), category: `Document Play History`, clickable: true, isVideo: false, parentCategory: t('menu.categories.documentCourses') },
      { id: 'private', label: t('menu.categories.privateInstruction'), category: t('menu.categories.private'), highlight: true, clickable: true, isMainCategory: true },
    ];
  };

  const menuItems = getMenuItems();

  const handleMenuClick = (item) => {
    if (!item.clickable) return;
    
    uiStore.setActiveCategory(item.category);
    uiStore.setCourseTypeFilter(item.isVideo);
    
    if (item.parentCategory) {
      uiStore.setParentCategory(item.parentCategory);
    }
    
    // Toggle expanded section for main categories
    if (item.category === t('menu.categories.testing')) {
      navigate('/exam');
      uiStore.resetFilters();
      uiStore.setActiveCategory(item.category);
    } else if (item.category === t('menu.categories.private')) {
      // Navigate to instructor listing page without any specific instructor
      navigate('/instructor');
      uiStore.resetFilters();
      uiStore.setActiveCategory(item.category);
      
      // Collapse other main categories when private is selected
      setExpandedSection(null);
    } else if (item.category === t('menu.categories.seriesCourses')) {
      navigate('/series');
      uiStore.resetFilters();
      uiStore.setActiveCategory(item.category);
      
      // Collapse other main categories when 私教 is selected
      setExpandedSection(null);
    } else if (item.isMainCategory) {
      // Always set expanded section to the clicked category, no toggling
      setExpandedSection(item.category);
      
      // Navigate to home page
      navigate('/');
      
      // Reset all filters before setting new category
      uiStore.resetFilters();
      uiStore.setActiveCategory(item.category);
    }
    
    // Close mobile menu if provided
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 overflow-y-auto py-4">
      {/* All menu items, with conditional rendering for submenus */}
      {menuItems.map(item => {
        // Skip submenu items when parent is not expanded
        if (item.parentCategory && item.parentCategory !== expandedSection) {
          return null;
        }
        
        const isActive = uiStore.activeCategory === item.category;
        const isMainCategory = item.isMainCategory;
        // Check if this main item is a parent of the active category
        const isParentOfActive = isMainCategory && menuItems.some(
          subItem => subItem.parentCategory === item.category && subItem.category === uiStore.activeCategory
        );
        
        return (
          <div
            key={item.id}
            className={`
              py-3 px-4 mb-2
              ${item.clickable ? 'cursor-pointer' : 'cursor-default'}
              ${isMainCategory && item.highlight ?
                (isActive || isParentOfActive ? 'bg-green-600 rounded-md mx-2 text-white' : 'bg-blue-500 rounded-md mx-2 text-white')
                : 'bg-transparent'}
              ${!isMainCategory && isActive ? 'text-blue-600' :
                (!isMainCategory ? 'text-black' : '')}
              ${isMainCategory ? '' : 'pl-8'}
              text-left
              ${item.parentCategory ? 'transition-all duration-200' : ''}
              touch-manipulation
            `}
            onClick={() => handleMenuClick(item)}
          >
            {/* For main categories, add an indicator if they can be expanded */}
            {isMainCategory ? (
              <div className="flex justify-between items-center">
                <span>{item.label}</span>
                {item.id !== 'private' && (
                  <span className="text-xs">
                    {expandedSection === item.category ? '▼' : '▶'}
                  </span>
                )}
              </div>
            ) : (
              item.label
            )}
          </div>
        );
      })}
    </div>
  );
});

export default LeftMenu;
