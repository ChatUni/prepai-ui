import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import userStore from '../stores/userStore';
import languageStore from '../stores/languageStore';
import DEFAULT_AVATAR from '../assets/avatar.png';

const AccountPage = observer(() => {
  const navigate = useNavigate();
  const t = languageStore.t;
  
  useEffect(() => {
    // Log for debugging
    console.log('AccountPage rendering with userInfo:', userStore.userInfo);
  }, []);

  const handleEditProfile = () => {
    // For future implementation
    console.log('Edit profile clicked');
  };

  const handleMenuItemClick = (action) => {
    console.log(`Menu item clicked: ${action}`);
    
    // Handle different menu actions
    switch(action) {
      case 'vip':
        // Navigate to VIP details page
        // navigate('/vip-details');
        break;
      case 'exams':
        // Fetch and display exam records
        userStore.fetchExamRecords();
        break;
      case 'service':
        // Open customer service chat
        // navigate('/customer-service');
        break;
      case 'coupons':
        // Fetch and display coupons
        userStore.fetchCoupons();
        break;
      case 'logout':
        // Perform logout and redirect to login page
        userStore.logout().then(() => {
          navigate('/login');
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col bg-gray-100 w-full max-w-sm">
      {/* All content container with consistent width */}
      <div className="w-full">
        {/* Profile Header */}
        <div className="bg-white p-4 mb-3 flex items-center justify-between rounded-lg shadow-sm">
          {/* Left side: Avatar and User Info */}
          <div className="flex items-center">
            {/* Avatar */}
            <div className="relative">
              <img
                src={userStore.userInfo?.avatar || DEFAULT_AVATAR}
                alt="User Avatar"
                className="w-20 h-20 rounded-full object-cover"
              />
              {/* Gender icon - male */}
              <div className="absolute -right-1 top-0 bg-blue-400 text-white rounded-full w-6 h-6 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10.5" cy="10.5" r="7.5"/>
                  <line x1="16.5" y1="16.5" x2="21" y2="21"/>
                  <line x1="16.5" y1="10.5" x2="21" y2="10.5"/>
                  <line x1="18.75" y1="8.25" x2="18.75" y2="12.75"/>
                </svg>
              </div>
            </div>
            
            {/* User Info */}
            <div className="ml-4">
              <h2 className="text-xl font-semibold">{t('menu.account_page.guest')}</h2>
              <p className="text-gray-600">ID: 53</p>
            </div>
          </div>
          
          {/* Right side: Edit Profile Button */}
          <button onClick={handleEditProfile} className="p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
        {/* Menu Options */}
        {/* VIP Status */}
        <div
          className="mb-3 text-center"
          onClick={() => handleMenuItemClick('vip')}
        >
          <div className="bg-white p-4 rounded-lg shadow-sm w-full flex items-center justify-between">
            <div>
              <span className="text-base mr-2">{t('menu.account_page.my_vip')}</span>
              <span className="text-gray-500 text-sm">{t('menu.account_page.valid_until')} 2025-12-27 10:33:52</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* Exam Records */}
        <div
          className="mb-3 text-center"
          onClick={() => handleMenuItemClick('exams')}
        >
          <div className="bg-white p-4 rounded-lg shadow-sm w-full flex items-center justify-between">
            <span>{t('menu.account_page.exam_records')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* Customer Service */}
        <div
          className="mb-3 text-center"
          onClick={() => handleMenuItemClick('service')}
        >
          <div className="bg-white p-4 rounded-lg shadow-sm w-full flex items-center justify-between">
            <span>{t('menu.account_page.customer_service')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* Coupons */}
        <div
          className="mb-3 text-center"
          onClick={() => handleMenuItemClick('coupons')}
        >
          <div className="bg-white p-4 rounded-lg shadow-sm w-full flex items-center justify-between">
            <span>{t('menu.account_page.coupons')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* Logout */}
        <div
          className="mb-3 text-center"
          onClick={() => handleMenuItemClick('logout')}
        >
          <div className="bg-white p-4 rounded-lg shadow-sm w-full flex items-center justify-between">
            <span>{t('menu.account_page.logout')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AccountPage;
