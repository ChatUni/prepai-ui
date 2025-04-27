import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import languageStore from '../../../stores/languageStore';
import adminStore from '../../../stores/adminStore';

const AdminPage = observer(() => {
  const navigate = useNavigate();
  const t = languageStore.t;
  const [expandedSection, setExpandedSection] = React.useState(null);

  const handleSectionClick = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleMenuItemClick = (action) => {
    console.log(`Admin menu item clicked: ${action}`);
    
    switch(action) {
      case 'new-instructor':
        navigate('/instructors/new');
        break;
      case 'edit-instructor':
        navigate('/instructors/select?mode=edit');
        break;
      case 'new-series':
        navigate('/series/new');
        break;
      case 'edit-series':
        navigate('/series/select');
        break;
      case 'add-course-to-series':
        navigate('/series/select');
        break;
      case 'add-assistant':
        navigate('/assistants/add');
        break;
      case 'edit-assistant':
        navigate('/assistants/select?mode=edit');
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col bg-gray-100 w-full max-w-sm">
      {/* Header */}
      <div className="bg-white p-4 mb-3 rounded-lg shadow-sm">
        <h1 className="text-2xl font-semibold text-center">{t('menu.admin_page.title')}</h1>
      </div>

      {/* Accordion Menu */}
      <div className="space-y-2">
        {/* Instructors Section */}
        <div className="overflow-hidden rounded-lg">
          <button
            className={`w-full p-4 flex items-center justify-between text-white transition-colors duration-200 ${
              expandedSection === 'instructors' ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
            onClick={() => handleSectionClick('instructors')}
          >
            <span className="font-semibold">{t('menu.instructor')}</span>
            <span className={`transform transition-transform duration-200 ${
              expandedSection === 'instructors' ? 'rotate-180' : ''
            }`}>▼</span>
          </button>
          <div className={`transition-all duration-200 ${
            expandedSection === 'instructors'
              ? 'max-h-40 opacity-100'
              : 'max-h-0 opacity-0'
          }`}>
            <div className="bg-white p-2 space-y-1">
              <button
                className="w-full p-3 text-left hover:bg-gray-50 rounded flex items-center justify-between"
                onClick={() => handleMenuItemClick('new-instructor')}
              >
                <span>{t('menu.admin_page.new_instructor')}</span>
                <span className="text-gray-400">→</span>
              </button>
              <button
                className="w-full p-3 text-left hover:bg-gray-50 rounded flex items-center justify-between"
                onClick={() => handleMenuItemClick('edit-instructor')}
              >
                <span>{t('menu.admin_page.edit_instructor')}</span>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Series Section */}
        <div className="overflow-hidden rounded-lg">
          <button
            className={`w-full p-4 flex items-center justify-between text-white transition-colors duration-200 ${
              expandedSection === 'series' ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
            onClick={() => handleSectionClick('series')}
          >
            <span className="font-semibold">{t('menu.series')}</span>
            <span className={`transform transition-transform duration-200 ${
              expandedSection === 'series' ? 'rotate-180' : ''
            }`}>▼</span>
          </button>
          <div className={`transition-all duration-200 ${
            expandedSection === 'series'
              ? 'max-h-60 opacity-100'
              : 'max-h-0 opacity-0'
          }`}>
            <div className="bg-white p-2 space-y-1">
              <button
                className="w-full p-3 text-left hover:bg-gray-50 rounded flex items-center justify-between"
                onClick={() => handleMenuItemClick('new-series')}
              >
                <span>{t('menu.admin_page.new_series')}</span>
                <span className="text-gray-400">→</span>
              </button>
              <button
                className="w-full p-3 text-left hover:bg-gray-50 rounded flex items-center justify-between"
                onClick={() => handleMenuItemClick('edit-series')}
              >
                <span>{t('menu.admin_page.edit_series')}</span>
                <span className="text-gray-400">→</span>
              </button>
              <button
                className="w-full p-3 text-left hover:bg-gray-50 rounded flex items-center justify-between"
                onClick={() => handleMenuItemClick('add-course-to-series')}
              >
                <span>{t('menu.admin_page.add_course_to_series')}</span>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Assistants Section */}
        <div className="overflow-hidden rounded-lg">
          <button
            className={`w-full p-4 flex items-center justify-between text-white transition-colors duration-200 ${
              expandedSection === 'assistants' ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
            onClick={() => handleSectionClick('assistants')}
          >
            <span className="font-semibold">{t('menu.assistants')}</span>
            <span className={`transform transition-transform duration-200 ${
              expandedSection === 'assistants' ? 'rotate-180' : ''
            }`}>▼</span>
          </button>
          <div className={`transition-all duration-200 ${
            expandedSection === 'assistants'
              ? 'max-h-40 opacity-100'
              : 'max-h-0 opacity-0'
          }`}>
            <div className="bg-white p-2 space-y-1">
              <button
                className="w-full p-3 text-left hover:bg-gray-50 rounded flex items-center justify-between"
                onClick={() => handleMenuItemClick('add-assistant')}
              >
                <span>{t('menu.admin_page.add_assistant')}</span>
                <span className="text-gray-400">→</span>
              </button>
              <button
                className="w-full p-3 text-left hover:bg-gray-50 rounded flex items-center justify-between"
                onClick={() => handleMenuItemClick('edit-assistant')}
              >
                <span>{t('menu.admin_page.edit_assistant')}</span>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AdminPage;