import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import languageStore from '../../../stores/languageStore';
import MenuListItem from '../../ui/MenuListItem';

const routeMap = {
  'new-instructor': '/instructors/new',
  'edit-instructor': '/instructors/select?mode=edit',
  'new-series': '/series/new',
  'edit-series': '/series/select',
  'edit-banner': '/series/banners',
  'add-course-to-series': '/series/select',
  'add-assistant': '/assistants/add',
  'edit-assistant': '/assistants/select?mode=edit',
  'upload-questions': '/exam/upload',
  'question-distribution': '/exam/distribution',
  'course-settings': '/series/settings'
};

const AdminPage = observer(() => {
  const navigate = useNavigate();
  const t = languageStore.t;

  return (
    <div className="flex flex-col bg-gray-100 w-full max-w-sm">
      {/* Header */}
      <div className="bg-white p-4 mb-3 rounded-lg shadow-sm">
        <h1 className="text-2xl font-semibold text-center">{t('menu.admin_page.title')}</h1>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        {/* <MenuListItem
          label={t('menu.admin_page.new_instructor')}
          onClick={() => navigate(routeMap['new-instructor'])}
        />
        <MenuListItem
          label={t('menu.admin_page.edit_instructor')}
          onClick={() => navigate(routeMap['edit-instructor'])}
        /> */}
        <MenuListItem
          label={t('menu.admin_page.new_series')}
          onClick={() => navigate(routeMap['new-series'])}
        />
        <MenuListItem
          label={t('menu.admin_page.edit_series')}
          onClick={() => navigate(routeMap['edit-series'])}
        />
        <MenuListItem
          label={t('menu.admin_page.add_course_to_series')}
          onClick={() => navigate(routeMap['add-course-to-series'])}
        />
        <MenuListItem
          label={t('series.banners.title')}
          onClick={() => navigate(routeMap['edit-banner'])}
        />
        <MenuListItem
          label={t('menu.admin_page.add_assistant')}
          onClick={() => navigate(routeMap['add-assistant'])}
        />
        <MenuListItem
          label={t('menu.admin_page.edit_assistant')}
          onClick={() => navigate(routeMap['edit-assistant'])}
        />
        <MenuListItem
          label={t('menu.admin_page.upload_questions')}
          onClick={() => navigate(routeMap['upload-questions'])}
        />
        <MenuListItem
          label={t('menu.admin_page.question_distribution')}
          onClick={() => navigate(routeMap['question-distribution'])}
        />
        <MenuListItem
          label={t('menu.admin_page.course_settings')}
          onClick={() => navigate(routeMap['course-settings'])}
        />
      </div>
    </div>
  );
});

export default AdminPage;