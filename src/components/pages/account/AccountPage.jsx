import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import userStore from '../../../stores/userStore';
import languageStore from '../../../stores/languageStore';
import DEFAULT_AVATAR from '../../../assets/avatar.png';
import MenuListItem from '../../ui/MenuListItem';

const AccountPage = observer(() => {
  const navigate = useNavigate();
  const t = languageStore.t;
  
  const handleEditProfile = () => {
    // For future implementation
    console.log('Edit profile clicked');
  };

  const handleMenuItemClick = (action) => {
    console.log(`Menu item clicked: ${action}`);
    
    // Handle different menu actions
    switch(action) {
      case 'admin':
        navigate('/admin');
        break;
      case 'my_series':
        navigate('/series/paid');
        break;
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
                src={userStore.avatar}
                alt="User Avatar"
                className="w-20 h-20 rounded-full object-cover"
              />
            </div>
            
            {/* User Info */}
            <div className="ml-4">
              <h2 className="text-xl font-semibold">{userStore.userName}</h2>
              <p className="text-gray-600">ID: {userStore.user.id}</p>
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
        {/* Menu Items */}
        {/* <MenuListItem
          label={t('menu.account_page.my_vip')}
          onClick={() => handleMenuItemClick('vip')}
          // extraInfo={`${t('menu.account_page.valid_until')} 2025-12-27 10:33:52`}
        /> */}
        {/* <MenuListItem
          label={t('menu.account_page.exam_records')}
          onClick={() => handleMenuItemClick('exams')}
        />
        <MenuListItem
          label={t('menu.account_page.customer_service')}
          onClick={() => handleMenuItemClick('service')}
        />
        <MenuListItem
          label={t('menu.account_page.coupons')}
          onClick={() => handleMenuItemClick('coupons')}
        /> */}
        <MenuListItem
          label={t('menu.account_page.my_series')}
          onClick={() => handleMenuItemClick('my_series')}
        />
        {userStore.isAdmin &&
          <MenuListItem
            label={t('menu.account_page.admin_portal')}
            onClick={() => handleMenuItemClick('admin')}
          />
        }
        <MenuListItem
          label={t('menu.account_page.logout')}
          onClick={() => handleMenuItemClick('logout')}
        />
      </div>
    </div>
  );
});

export default AccountPage;
