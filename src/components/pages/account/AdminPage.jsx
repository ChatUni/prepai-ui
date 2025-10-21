import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import {
  FiSettings,
  FiUsers,
  FiBookOpen,
  FiFileText,
  FiMessageSquare,
  FiDollarSign,
  FiTrendingUp,
  FiMonitor,
  FiSliders,
  FiImage,
  FiArrowLeft,
  FiBarChart,
  FiUser
} from 'react-icons/fi';
import { t } from '../../../stores/languageStore';
import MenuListItem from '../../ui/MenuListItem';
import userStore from '../../../stores/userStore';

const routeMap = {
  'new-instructor': '/instructors/new',
  'edit-instructor': '/instructors/settings',
  'new-series': '/series/new',
  'edit-series': '/series/select',
  'edit-banner': '/series/banners',
  'add-course-to-series': '/series/select',
  'manage-assistant': '/assistants/settings',
  'upload-questions': '/exam/upload',
  'question-distribution': '/exam/distribution',
  'course-settings': '/series/settings',
  'sub-admin-settings': '/users/settings',
  'exam-settings': '/exams/settings',
  'price-settings': '/memberships/settings',
  'upgrade': '/memberships/upgrade',
  'orders': '/orders',
  'basic-settings': '/client/settings',
  'advanced-settings': '/client/advanced-settings',
  'banner-settings': '/settings/banners',
  'my_account': '/my_account'
};

const AdminPage = observer(() => {
  const navigate = useNavigate();
  const [currentMenu, setCurrentMenu] = useState('main');

  if (!userStore.isAdmin) return null;

  const handleSystemSettingsClick = () => {
    setCurrentMenu('system-settings');
  };

  const handleBackClick = () => {
    setCurrentMenu('main');
  };

  const renderMainMenu = () => (
    <>
      <MenuListItem
        label={t('menu.admin_page.system_settings')}
        onClick={handleSystemSettingsClick}
        icon={FiSettings}
        iconColor="text-blue-500"
      />
      {userStore.isClientAdmin &&
        <MenuListItem
          label={t('menu.admin_page.sub_admin_settings')}
          onClick={() => navigate(routeMap['sub-admin-settings'])}
          icon={FiUsers}
          iconColor="text-purple-500"
        />
      }
      <MenuListItem
        label={t('menu.admin_page.course_settings')}
        onClick={() => navigate(routeMap['course-settings'])}
        icon={FiBookOpen}
        iconColor="text-green-500"
      />
      <MenuListItem
        label={t('menu.admin_page.exam_settings')}
        onClick={() => navigate(routeMap['exam-settings'])}
        icon={FiFileText}
        iconColor="text-yellow-500"
      />
      <MenuListItem
        label={t('menu.admin_page.manage_assistant')}
        onClick={() => navigate(routeMap['manage-assistant'])}
        icon={FiMessageSquare}
        iconColor="text-purple-500"
      />
      <MenuListItem
        label={t('menu.admin_page.price_settings')}
        onClick={() => navigate(routeMap['price-settings'])}
        icon={FiDollarSign}
        iconColor="text-red-500"
      />
      <MenuListItem
        label={t('menu.admin_page.upgrade')}
        onClick={() => navigate(routeMap['upgrade'])}
        icon={FiTrendingUp}
        iconColor="text-cyan-500"
      />
      <MenuListItem
        label={t('menu.admin_page.orders')}
        onClick={() => navigate(routeMap['orders'])}
        icon={FiBarChart}
        iconColor="text-indigo-500"
      />
      {userStore.isClientAdmin &&
        <MenuListItem
          label={t('menu.admin_page.my_account')}
          onClick={() => navigate(routeMap['my_account'])}
          icon={FiUser}
          iconColor="text-orange-500"
        />
      }
    </>
  );

  const renderSystemSettingsMenu = () => (
    <>
      <MenuListItem
        label={t('menu.admin_page.basic_settings')}
        onClick={() => navigate(routeMap['basic-settings'])}
        icon={FiMonitor}
        iconColor="text-blue-500"
      />
      <MenuListItem
        label={t('menu.admin_page.advanced_settings')}
        onClick={() => navigate(routeMap['advanced-settings'])}
        icon={FiSliders}
        iconColor="text-orange-500"
      />
      <MenuListItem
        label={t('menu.admin_page.banner_settings')}
        onClick={() => navigate(routeMap['banner-settings'])}
        icon={FiImage}
        iconColor="text-pink-500"
      />
      <MenuListItem
        label={t('menu.admin_page.back')}
        onClick={handleBackClick}
        icon={FiArrowLeft}
        iconColor="text-gray-500"
      />
    </>
  );

  const getHeaderTitle = () => {
    if (currentMenu === 'system-settings') {
      return t('menu.admin_page.system_settings');
    }
    return t('menu.admin_page.title');
  };

  return (
    <div className="flex flex-col bg-gray-100 w-full max-w-sm">
      {/* Header */}
      <div className="bg-white p-4 mb-3 rounded-lg shadow-sm">
        <h1 className="text-2xl font-semibold text-center">{getHeaderTitle()}</h1>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        {currentMenu === 'main' ? renderMainMenu() : renderSystemSettingsMenu()}
      </div>
    </div>
  );
});

export default AdminPage;