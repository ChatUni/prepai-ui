import { observer } from 'mobx-react-lite';
import { t } from '../../../stores/languageStore';
import store from '../../../stores/membershipStore';
import MembershipCard from './MembershipCard';
import ListPage from '../../ui/ListPage';
import EditMembershipPage from './EditMembershipPage';

const MembershipListPage = observer(() => {

  const renderMembershipCard = (membership, index) => (
    <MembershipCard
      key={membership.id || index}
      membership={membership}
      index={index}
      moveMembership={store.moveMembership}
      isDraggable={true}
    />
  );

  return (
    <div className="flex flex-col bg-gray-100 w-full max-w-6xl mx-auto">
      <div className="bg-white p-4">
        <ListPage
          isGrouped={false}
          store={store}
          renderItem={renderMembershipCard}
          itemsContainerClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          editDialogChildren={<EditMembershipPage />}
        />
      </div>
    </div>
  );
});

export default MembershipListPage;

        // {/* Description Box */}
        // <div className="bg-white text-gray-800 p-6 rounded-lg mb-6 border border-gray-200">
        //   <h1 className="text-2xl font-semibold mb-3">{t('membership.priceSettings.title')}</h1>
        //   <p className="text-gray-600 leading-relaxed">
        //     {t('membership.priceSettings.description')}
        //   </p>
        // </div>

//                  editDialogTitle={store.isEditMode ? t('membership.edit') : t('membership.createNew')}
