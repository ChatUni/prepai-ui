import { observer } from 'mobx-react-lite';
import Logo from '../ui/Logo';
import uiStore from '../../stores/uiStore';
import userStore from '../../stores/userStore';
import languageStore from '../../stores/languageStore';
import routeStore from '../../stores/routeStore';
import LanguageSelector from '../ui/LanguageSelector';
import BackButton from '../ui/BackButton';
import { useLocation, useNavigate } from 'react-router-dom';
import clientStore from '../../stores/clientStore';

const TopNavBar = observer(({ onMenuToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const showBackButton = !routeStore.isTopLevelPage;
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
    <>
      {/* Top row with logo and hamburger menu */}
      <div className="flex items-center justify-between w-full border-b border-gray-200 p-4">
        {/* Left section with back button and logo */}
        <div className="flex items-center">
          {showBackButton && (
            <div className="mr-4">
              <BackButton />
            </div>
          )}

          <div className="flex-none">
            <Logo />
          </div>

          {/* Login/User info */}
          {/* <div className="ml-4 hidden md:block">
            {isLoggedIn ? (
              <div className="text-sm text-gray-600">
                {userStore.user.name}
              </div>
            ) : (
              <button
                onClick={handleLoginClick}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {t('auth.login')}
              </button>
            )}
          </div> */}
        </div>

        <div className="flex-grow text-3xl font-bold ml-4 text-center">
          {clientStore.client.name}
        </div>

        {/* Language selector */}
        {/* <div className="absolute right-16 md:right-4 top-4">
          <LanguageSelector />
        </div> */}
        
        {/* Flexible middle section with desktop navigation items */}
        <div className="flex justify-center mr-2">
          <div className="hidden md:flex gap-4 lg:gap-12">
            {navItems.filter(x => !x.hide).map(item => {
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
        {/* <div className="md:hidden">
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
        </div> */}
        
        {/* No duplicate desktop navigation needed */}
      </div>
      
      {/* Mobile navigation items - fixed at the bottom of the screen */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-12 z-50 shadow-lg">
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
    </>
  );
});

export default TopNavBar;
