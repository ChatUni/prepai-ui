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
    <div className={`grid ${userStore.isAdmin ? 'grid-cols-5' : 'grid-cols-4'} gap-4 mb-8`}>
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
      <ToolNavItem
        onClick={() => navigate('/series?mode=group')}
        title={t('tools.groupedSeries')}
        bgColor="bg-indigo-500"
        icon={<HiOutlineViewGrid className="h-6 w-6 text-white" />}
      />
      {userStore.isAdmin && (
        <ToolNavItem
          onClick={() => navigate('/series/banners')}
          title={t('series.banners.title')}
          bgColor="bg-purple-500"
          icon={<BsImages className="h-6 w-6 text-white" />}
        />
      )}
    </div>
  );
});

export default ToolsNav;