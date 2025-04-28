import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import languageStore from '../../../stores/languageStore';
import { AccordionSection, MenuItem } from '../../ui/AdminAccordion';

const routeMap = {
  'new-instructor': '/instructors/new',
  'edit-instructor': '/instructors/select?mode=edit',
  'new-series': '/series/new',
  'edit-series': '/series/select',
  'edit-banner': '/series/banners',
  'add-course-to-series': '/series/select',
  'add-assistant': '/assistants/add',
  'edit-assistant': '/assistants/select?mode=edit'
};

const AdminPage = observer(() => {
  const navigate = useNavigate();
  const t = languageStore.t;
  const [expandedSection, setExpandedSection] = React.useState(null);

  const handleSectionClick = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
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
        <AccordionSection
          title={t('menu.instructor')}
          isExpanded={expandedSection === 'instructors'}
          onToggle={() => handleSectionClick('instructors')}
        >
          <MenuItem
            label={t('menu.admin_page.new_instructor')}
            onClick={() => navigate(routeMap['new-instructor'])}
          />
          <MenuItem
            label={t('menu.admin_page.edit_instructor')}
            onClick={() => navigate(routeMap['edit-instructor'])}
          />
        </AccordionSection>

        {/* Series Section */}
        <AccordionSection
          title={t('menu.series')}
          isExpanded={expandedSection === 'series'}
          onToggle={() => handleSectionClick('series')}
          maxHeight="60"
        >
          <MenuItem
            label={t('menu.admin_page.new_series')}
            onClick={() => navigate(routeMap['new-series'])}
          />
          <MenuItem
            label={t('menu.admin_page.edit_series')}
            onClick={() => navigate(routeMap['edit-series'])}
          />
          <MenuItem
            label={t('menu.admin_page.add_course_to_series')}
            onClick={() => navigate(routeMap['add-course-to-series'])}
          />
          <MenuItem
            label={t('series.banners.title')}
            onClick={() => navigate(routeMap['edit-banner'])}
          />
        </AccordionSection>

        {/* Assistants Section */}
        <AccordionSection
          title={t('menu.assistants')}
          isExpanded={expandedSection === 'assistants'}
          onToggle={() => handleSectionClick('assistants')}
        >
          <MenuItem
            label={t('menu.admin_page.add_assistant')}
            onClick={() => navigate(routeMap['add-assistant'])}
          />
          <MenuItem
            label={t('menu.admin_page.edit_assistant')}
            onClick={() => navigate(routeMap['edit-assistant'])}
          />
        </AccordionSection>
      </div>
    </div>
  );
});

export default AdminPage;