import { observer } from 'mobx-react-lite';
import uiStore from '../../stores/uiStore';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import languageStore from '../../stores/languageStore';

const LeftMenu = observer(({ onItemClick }) => {
  const t = languageStore.t;
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState(null);
  
  // Initialize expanded section based on current route
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/video')) {
      setExpandedSection('videoCourses');
    } else if (path.includes('/ppt')) {
      setExpandedSection('documentCourses');
    }
  }, []);
  
  const getMenuItems = () => {
    return [
      { id: 'exam', label: t('menu.categories.testing'), category: 'testing', highlight: true, clickable: true, isMainCategory: true },
      { id: 'series', label: t('menu.categories.seriesCourses'), category: 'seriesCourses', highlight: true, clickable: true, isMainCategory: true },
      { id: 'video', label: t('menu.categories.videoCourses'), category: 'videoCourses', highlight: true, clickable: true, isVideo: true, isMainCategory: true },
      { id: 'video-recommended', label: t('menu.categories.recommended'), category: 'videoRecommended', clickable: true, isVideo: true, parentCategory: 'videoCourses' },
      { id: 'video-collection', label: t('menu.categories.myFavorites'), category: 'videoFavorites', clickable: true, isVideo: true, parentCategory: 'videoCourses' },
      { id: 'video-history', label: t('menu.categories.playHistory'), category: 'videoPlayHistory', clickable: true, isVideo: true, parentCategory: 'videoCourses' },
      // Document course section
      { id: 'document', label: t('menu.categories.documentCourses'), category: 'documentCourses', highlight: true, clickable: true, isVideo: false, isMainCategory: true },
      { id: 'document-recommended', label: t('menu.categories.recommended'), category: 'documentRecommended', clickable: true, isVideo: false, parentCategory: 'documentCourses' },
      { id: 'document-collection', label: t('menu.categories.myFavorites'), category: 'documentFavorites', clickable: true, isVideo: false, parentCategory: 'documentCourses' },
      { id: 'document-history', label: t('menu.categories.playHistory'), category: 'documentPlayHistory', clickable: true, isVideo: false, parentCategory: 'documentCourses' },
      { id: 'private', label: t('menu.categories.privateInstruction'), category: 'private', highlight: true, clickable: true, isMainCategory: true },
    ];
  };

  const menuItems = getMenuItems();

  const handleMenuClick = (item) => {
    if (!item.clickable) return;

    // Handle navigation based on item type
    switch (item.id) {
      case 'exam':
        navigate('/exam');
        break;
      case 'series':
        navigate('/series');
        break;
      case 'private':
        navigate('/instructor');
        setExpandedSection(null);
        break;
      case 'video':
      case 'document':
        setExpandedSection(item.category);
        navigate('/');
        break;
      case 'video-recommended':
      case 'document-recommended':
        navigate('/');
        break;
      case 'video-collection':
      case 'document-collection':
        navigate('/favorites');
        break;
      case 'video-history':
      case 'document-history':
        navigate('/');
        break;
    }

    // Update course type filter based on item type
    if (item.isVideo !== undefined) {
      uiStore.setCourseTypeFilter(item.isVideo);
    }

    // Reset filters when navigating
    uiStore.resetFilters();
    
    // Update active nav item for UI purposes
    uiStore.setActiveNavItem(item.category);
    
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
        
        const path = window.location.pathname;
        const isActive = (
          (item.id === 'exam' && path.startsWith('/exam')) ||
          (item.id === 'series' && path.startsWith('/series')) ||
          (item.id === 'private' && path.startsWith('/instructor')) ||
          (item.id === 'video' && path === '/' && uiStore.courseTypeFilter) ||
          (item.id === 'document' && path === '/' && !uiStore.courseTypeFilter) ||
          (item.id.includes('collection') && path === '/favorites') ||
          (item.id === 'video-recommended' && path === '/' && uiStore.courseTypeFilter) ||
          (item.id === 'document-recommended' && path === '/' && !uiStore.courseTypeFilter)
        );
        
        const isMainCategory = item.isMainCategory;
        const isParentOfActive = isMainCategory && (
          (item.category === 'videoCourses' && path === '/' && uiStore.courseTypeFilter) ||
          (item.category === 'documentCourses' && path === '/' && !uiStore.courseTypeFilter)
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
