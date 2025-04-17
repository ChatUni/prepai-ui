import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import languageStore from '../stores/languageStore';
import adminStore from '../stores/adminStore';

const AdminPage = observer(() => {
  const navigate = useNavigate();
  const t = languageStore.t;

  const handleMenuItemClick = (action) => {
    console.log(`Admin menu item clicked: ${action}`);
    
    switch(action) {
      case 'new-instructor':
        // TODO: Navigate to new instructor page
        break;
      case 'edit-instructor':
        // TODO: Navigate to edit instructor page
        break;
      case 'new-series':
        navigate('/series/new');
        break;
      case 'edit-series':
        // TODO: Navigate to series list for editing
        break;
      case 'add-course-to-series':
        navigate('/series/select');
        break;
      case 'add-assistant':
        navigate('/assistants/add');
        break;
      case 'edit-assistant':
        navigate('/assistants');
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col bg-gray-100 w-full max-w-sm">
      <div className="w-full">
        {/* Header */}
        <div className="bg-white p-4 mb-3 rounded-lg shadow-sm">
          <h1 className="text-2xl font-semibold text-center">{t('menu.admin_page.title')}</h1>
        </div>

        {/* Menu Items */}
        {/* New Instructor */}
        <div
          className="mb-3 text-center"
          onClick={() => handleMenuItemClick('new-instructor')}
        >
          <div className="bg-white p-4 rounded-lg shadow-sm w-full flex items-center justify-between">
            <span>{t('menu.admin_page.new_instructor')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Edit Instructor */}
        <div
          className="mb-3 text-center"
          onClick={() => handleMenuItemClick('edit-instructor')}
        >
          <div className="bg-white p-4 rounded-lg shadow-sm w-full flex items-center justify-between">
            <span>{t('menu.admin_page.edit_instructor')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* New Series */}
        <div
          className="mb-3 text-center"
          onClick={() => handleMenuItemClick('new-series')}
        >
          <div className="bg-white p-4 rounded-lg shadow-sm w-full flex items-center justify-between">
            <span>{t('menu.admin_page.new_series')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Edit Series */}
        <div
          className="mb-3 text-center"
          onClick={() => handleMenuItemClick('edit-series')}
        >
          <div className="bg-white p-4 rounded-lg shadow-sm w-full flex items-center justify-between">
            <span>{t('menu.admin_page.edit_series')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Add Course to Series */}
        <div
          className="mb-3 text-center"
          onClick={() => handleMenuItemClick('add-course-to-series')}
        >
          <div className="bg-white p-4 rounded-lg shadow-sm w-full flex items-center justify-between">
            <span>{t('menu.admin_page.add_course_to_series')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Add Assistant */}
        <div
          className="mb-3 text-center"
          onClick={() => handleMenuItemClick('add-assistant')}
        >
          <div className="bg-white p-4 rounded-lg shadow-sm w-full flex items-center justify-between">
            <span>{t('menu.admin_page.add_assistant')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Edit Assistant */}
        <div
          className="mb-3 text-center"
          onClick={() => handleMenuItemClick('edit-assistant')}
        >
          <div className="bg-white p-4 rounded-lg shadow-sm w-full flex items-center justify-between">
            <span>{t('menu.admin_page.edit_assistant')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AdminPage;