import { observer } from 'mobx-react-lite';
import Logo from '../ui/Logo';
import uiStore from '../../stores/uiStore';
import userStore from '../../stores/userStore';
import languageStore from '../../stores/languageStore';
import LanguageSelector from '../ui/LanguageSelector';
import { useLocation, useNavigate } from 'react-router-dom';

const TopNavBar = observer(({ onMenuToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isVideoPlayerPage = location.pathname.startsWith('/video/');
  const isLoggedIn = userStore.userInfo.isLoggedIn;
  const { t } = languageStore;
  
  const navItems = [
    { id: 'testing', label: t('menu.testing') },
    { id: 'private', label: t('menu.private') },
    { id: 'ai', label: t('menu.ai') },
    { id: 'my', label: t('menu.my') }
  ];

  const handleNavClick = (item) => {
    // Update active nav item for UI highlighting
    uiStore.setActiveNavItem(item.label);
    
    // Reset filters when navigating
    uiStore.resetFilters();
    
    // Handle navigation based on item type
    switch (item.id) {
      case 'testing':
        navigate('/exam');
        break;
      case 'private':
        uiStore.setCourseTypeFilter(true); // Set to video courses
        navigate('/instructor');
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
    <>
      {/* Top row with logo and hamburger menu */}
      <div className="flex items-center justify-between w-full border-b border-gray-200 p-4">
        {/* Left section with back button and logo */}
        <div className="flex items-center">
          {isVideoPlayerPage && (
            <button
              className="md:hidden mr-4 text-gray-600 focus:outline-none"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
          )}

          <div className="flex-none">
            <Logo />
          </div>
          
          {/* Login/User info */}
          <div className="ml-4 hidden md:block">
            {isLoggedIn ? (
              <div className="text-sm text-gray-600">
                {userStore.userInfo.username}
              </div>
            ) : (
              <button
                onClick={handleLoginClick}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {t('auth.login')}
              </button>
            )}
          </div>
        </div>

        {/* Language selector */}
        <div className="absolute right-16 md:right-4 top-4">
          <LanguageSelector />
        </div>
        
        {/* Flexible middle section with desktop navigation items */}
        <div className="flex-grow flex justify-center">
          <div className="hidden md:flex gap-4 lg:gap-12">
            {navItems.map(item => {
              const isActive = uiStore.activeNavItem === item.label;
              
              return (
                <div
                  key={item.id}
                  className={`text-base lg:text-xl font-medium cursor-pointer ${
                    isActive ? 'text-teal-500 border-b-2 border-teal-500' : 'text-black'
                  }`}
                  onClick={() => handleNavClick(item)}
                >
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Right side - hamburger menu */}
        <div className="md:hidden">
          <button
            className="text-gray-600 focus:outline-none"
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
        
        {/* No duplicate desktop navigation needed */}
      </div>
      
      {/* Mobile navigation items - fixed at the bottom of the screen */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 z-50 shadow-lg">
        <div className="flex justify-around items-center">
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
            navItems.map(item => {
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
    </>
  );
});

export default TopNavBar;
