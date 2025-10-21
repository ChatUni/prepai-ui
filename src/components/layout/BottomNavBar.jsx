import { observer } from 'mobx-react-lite';
import uiStore from '../../stores/uiStore';
import userStore from '../../stores/userStore';
import languageStore from '../../stores/languageStore';
import { useNavigate } from 'react-router-dom';
import clientStore from '../../stores/clientStore';

const BottomNavBar = observer(() => {
  const navigate = useNavigate();
  const isLoggedIn = userStore.isLoggedIn;
  const { t } = languageStore;

  const navItems = [
    { id: 'private', label: t('menu.private'), hide: userStore.isSuperAdmin || clientStore.client.hideSeries },
    { id: 'testing', label: t('menu.testing'), hide: userStore.isSuperAdmin || clientStore.client.hideExam },
    { id: 'ai', label: t('menu.ai'), hide: userStore.isSuperAdmin },
    { id: 'my', label: t('menu.my') }
  ];

  const handleNavClick = (item) => {
    // Update active nav item for UI highlighting
    uiStore.setActiveNavItem(item.label);
    
    // Reset filters when navigating
    uiStore.resetFilters();
    
    // Handle navigation based on item type
    switch (item.id) {
      case 'private':
        uiStore.setCourseTypeFilter(true); // Set to video courses
        navigate('/series');
        break;
      case 'testing':
        navigate('/exams');
        break;
      case 'ai':
        navigate('/assistants');
        break;
      case 'my':
        navigate('/account');
        break;
    }
  };
  
  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="md:hidden bg-white border-t border-gray-200 h-12 shadow-lg flex-shrink-0">
      <div className="flex justify-around items-center h-full">
        {!isLoggedIn ? (
          // Show login button when not logged in
          <div
            className="text-sm font-medium cursor-pointer flex flex-col items-center text-blue-600"
            onClick={handleLoginClick}
          >
            <div>{t('auth.login')}</div>
          </div>
        ) : (
          // Show navigation items when logged in
          navItems.filter(x => !x.hide).map(item => {
            const isActive = uiStore.activeNavItem === item.label;
            
            return (
              <div
                key={item.id}
                className={`text-sm font-medium cursor-pointer flex flex-col items-center ${
                  isActive ? 'text-teal-500' : 'text-gray-600'
                }`}
                onClick={() => handleNavClick(item)}
              >
                {/* You could add icons here for each nav item */}
                <div className={`${isActive ? 'border-b-2 border-teal-500' : ''}`}>
                  {item.label}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

export default BottomNavBar;