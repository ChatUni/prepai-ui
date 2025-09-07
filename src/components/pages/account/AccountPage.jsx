import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { FiBookOpen, FiMessageSquare, FiSettings, FiInfo, FiLogOut, FiUser } from 'react-icons/fi';
import userStore from '../../../stores/userStore';
import { t } from '../../../stores/languageStore';
import DEFAULT_AVATAR from '../../../assets/avatar.png';
import MenuListItem from '../../ui/MenuListItem';
import UserCard from './UserCard';
import UserListPage from './UserListPage';

const AccountPage = observer(() => {
  const navigate = useNavigate();
  
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
      case 'my_assistants':
        navigate('/assistants/user');
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
      case 'about':
        navigate('/about');
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
          <UserCard user={userStore.user} isProfile />          
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
        {!userStore.isSuperAdmin &&
          <>
            <MenuListItem
              label={t('menu.account_page.my_series')}
              onClick={() => handleMenuItemClick('my_series')}
              icon={FiBookOpen}
              iconColor="text-green-500"
            />
            <MenuListItem
              label={t('menu.account_page.my_assistants')}
              onClick={() => handleMenuItemClick('my_assistants')}
              icon={FiMessageSquare}
              iconColor="text-purple-500"
            />
          </>
        }
        {userStore.isAdmin &&
          <MenuListItem
            label={t('menu.account_page.admin_portal')}
            onClick={() => handleMenuItemClick('admin')}
            icon={FiSettings}
            iconColor="text-blue-500"
          />
        }
        <MenuListItem
          label={t('menu.account_page.about')}
          onClick={() => handleMenuItemClick('about')}
          icon={FiInfo}
          iconColor="text-gray-500"
        />
        <MenuListItem
          label={t('menu.account_page.logout')}
          onClick={() => handleMenuItemClick('logout')}
          icon={FiLogOut}
          iconColor="text-red-500"
        />
      </div>
      {/* <UserListPage showSearchBar={false} hideList={true} /> */}
      {<UserListPage showDialogsOnly={true} />}
    </div>
  );
});

export default AccountPage;
