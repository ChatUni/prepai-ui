import React from 'react';
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
  FiUser,
  FiUserPlus
} from 'react-icons/fi';
import { t } from '../../../stores/languageStore';
import MenuListItem from '../../ui/MenuListItem';
import userStore from '../../../stores/userStore';
import adminStore from '../../../stores/adminStore';
import clientStore from '../../../stores/clientStore';
import Dialog from '../../ui/Dialog';
import FormInput from '../../ui/FormInput';

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

  if (!userStore.isAdmin) return null;

  const renderMainMenu = () => (
    <>
      <MenuListItem
        label={t('menu.admin_page.system_settings')}
        onClick={adminStore.handleSystemSettingsClick}
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
      {userStore.isSuperAdmin &&
        <MenuListItem
          label={t('menu.admin_page.create_client')}
          onClick={adminStore.handleCreateClientClick}
          icon={FiUserPlus}
          iconColor="text-green-600"
        />
      }
      <MenuListItem
        label={t('menu.admin_page.back')}
        onClick={() => adminStore.handleBackClick(navigate)}
        icon={FiArrowLeft}
        iconColor="text-gray-500"
      />
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
        onClick={() => adminStore.handleBackClick(navigate)}
        icon={FiArrowLeft}
        iconColor="text-gray-500"
      />
    </>
  );

  const getHeaderTitle = () => {
    if (adminStore.currentMenu === 'system-settings') {
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
        {adminStore.currentMenu === 'main' ? renderMainMenu() : renderSystemSettingsMenu()}
      </div>

      {/* Create Client Dialog */}
      <Dialog
        isOpen={clientStore.showCreateClientDialog}
        onClose={() => clientStore.closeCreateClientDialog()}
        onConfirm={() => clientStore.createNewClient()}
        title={t('menu.admin_page.create_client')}
        isConfirm={true}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('client.name')}
            </label>
            <input
              type="text"
              value={clientStore.newClientData.name}
              onChange={(e) => clientStore.setNewClientField('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('client.name')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('client.host')}
            </label>
            <input
              type="text"
              value={clientStore.newClientData.host}
              onChange={(e) => clientStore.setNewClientField('host', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('client.host')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('client.phone')}
            </label>
            <input
              type="text"
              value={clientStore.newClientData.phone}
              onChange={(e) => clientStore.setNewClientField('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('client.phone')}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
});

export default AdminPage;