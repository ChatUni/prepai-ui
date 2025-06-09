import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { MdVideoLibrary, MdEmail } from 'react-icons/md';
import { BiCategoryAlt } from 'react-icons/bi';
import { BsImages } from 'react-icons/bs';
import { HiOutlineViewGrid } from 'react-icons/hi';
import ToolNavItem from './ToolNavItem';
import languageStore from '../../stores/languageStore';
import userStore from '../../stores/userStore';

const ToolsNav = observer(() => {
  const navigate = useNavigate();
  const { t } = languageStore;

  return (
    <div className={`grid grid-cols-3 gap-4 mb-8`}>
      <ToolNavItem
        onClick={() => navigate('/favorites')}
        title={t('tools.purchasedCourses')}
        bgColor="bg-blue-500"
        icon={<MdVideoLibrary className="h-6 w-6 text-white" />}
      />
      <ToolNavItem
        onClick={() => navigate('/series')}
        title={t('tools.courseCategories')}
        bgColor="bg-emerald-500"
        icon={<BiCategoryAlt className="h-6 w-6 text-white" />}
      />
      <ToolNavItem
        onClick={() => navigate('/account')}
        title={t('tools.myMessages')}
        bgColor="bg-amber-500"
        icon={<MdEmail className="h-6 w-6 text-white" />}
      />
    </div>
  );
});

export default ToolsNav;