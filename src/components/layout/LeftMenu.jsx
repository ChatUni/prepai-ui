import { observer } from 'mobx-react-lite';
import uiStore from '../../stores/uiStore';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const LeftMenu = observer(({ onItemClick }) => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState(null);
  
  // Initialize expanded section based on active category
  useEffect(() => {
    if (uiStore.activeCategory.includes('视频')) {
      setExpandedSection('视频课程');
    } else if (uiStore.activeCategory.includes('文档')) {
      setExpandedSection('文档课程');
    }
  }, []);
  
  const getMenuItems = () => {
    if (uiStore.activeNavItem === '考测') {
      return [
        { id: 'exam', label: '考测', category: '考测', clickable: false }
      ];
    }
    
    return [
      { id: 'series', label: '系列课程', category: '系列课程', highlight: true, clickable: true, isMainCategory: true },
      { id: 'video', label: '视频课程', category: '视频课程', highlight: true, clickable: true, isVideo: true, isMainCategory: true },
      { id: 'video-recommended', label: '推荐', category: '视频推荐', clickable: true, isVideo: true, parentCategory: '视频课程' },
      { id: 'video-collection', label: '我的收藏', category: '视频收藏', clickable: true, isVideo: true, parentCategory: '视频课程' },
      { id: 'video-history', label: '播放历史', category: '视频历史', clickable: true, isVideo: true, parentCategory: '视频课程' },
      // Document course section
      { id: 'document', label: '文档课程', category: '文档课程', highlight: true, clickable: true, isVideo: false, isMainCategory: true },
      { id: 'document-recommended', label: '推荐', category: '文档推荐', clickable: true, isVideo: false, parentCategory: '文档课程' },
      { id: 'document-collection', label: '我的收藏', category: '文档收藏', clickable: true, isVideo: false, parentCategory: '文档课程' },
      { id: 'document-history', label: '播放历史', category: '文档历史', clickable: true, isVideo: false, parentCategory: '文档课程' },
      { id: 'private', label: '私教实时语音辅导', category: '私教', highlight: true, clickable: true, isMainCategory: true },
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
    if (item.category === '考测') {
      navigate('/exam');
      uiStore.resetFilters();
      uiStore.setActiveCategory(item.category);
    } else if (item.category === '私教') {
      // Navigate to instructor listing page without any specific instructor
      navigate('/instructor');
      uiStore.resetFilters();
      uiStore.setActiveCategory(item.category);
      
      // Collapse other main categories when 私教 is selected
      setExpandedSection(null);
    } else if (item.category === '系列课程') {
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
