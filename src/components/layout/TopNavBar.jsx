import { observer } from 'mobx-react-lite';
import Logo from '../ui/Logo';
import uiStore from '../../stores/uiStore';

const TopNavBar = observer(() => {
  const navItems = [
    { id: 'testing', label: '考测' },
    { id: 'private', label: '私教' },
    { id: 'ai', label: 'AI助理' },
    { id: 'my', label: '我的' }
  ];

  const handleNavClick = (item) => {
    uiStore.setActiveNavItem(item.label);
    
    if (item.id === 'testing') {
      uiStore.setActiveCategory('考测');
      // Reset other states when switching to exam mode
      uiStore.setSelectedInstructorId(null);
      uiStore.setSearchKeyword('');
      uiStore.setParentCategory(null);
    } else if (item.id === 'private') {
      uiStore.setActiveCategory('视频课程');
      uiStore.setCourseTypeFilter(true); // Set to video courses
      uiStore.setParentCategory(null);
      uiStore.setSelectedInstructorId(null);
      uiStore.setSearchKeyword('');
    }
  };

  return (
    <div className="flex items-center justify-between w-full border-b border-gray-200 p-4">
      <Logo />
      
      <div className="flex gap-12">
        {navItems.map(item => {
          const isActive = uiStore.activeNavItem === item.label;
          
          return (
            <div 
              key={item.id}
              className={`text-xl font-medium cursor-pointer ${
                isActive ? 'text-teal-500 border-b-2 border-teal-500' : 'text-black'
              }`}
              onClick={() => handleNavClick(item)}
            >
              {item.label}
            </div>
          );
        })}
      </div>
      
      <div className="w-12 h-12 bg-blue-600 rounded-full"></div>
    </div>
  );
});

export default TopNavBar;
