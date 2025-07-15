import { observer } from 'mobx-react-lite';
import CardEditActions from '../../ui/CardEditActions';
import store from '../../../stores/userStore';
import { t } from '../../../stores/languageStore';

const UserCard = observer(({ user, isProfile }) => (
  <div className="relative w-full">
    <div className="flex items-center">
      {/* Avatar */}
      <div className="relative">
        <img
          src={store.getAvatar(user)}
          alt="User Avatar"
          className="w-20 h-20 rounded-full object-cover"
        />
      </div>
      
      {/* User Info */}
      <div className="ml-4">
        <h2 className="text-xl font-semibold">{store.getUserName(user)}</h2>
        <p className="text-gray-600">ID: {user.id}</p>
        <p className="text-gray-600">{`${t('user.phone')}: ${user.phone}`}</p>
        {isProfile && store.isMember && (
          <p className="text-green-600 text-sm">
            {t('menu.account_page.membership_expires')}: {store.getExpireDate('membership')?.toLocaleDateString()}
          </p>
        )}
      </div>
    </div>

    {isProfile && (
      <CardEditActions
        store={store}
        item={user}
        hideDelete={() => true}
        hideDrag={true}
        hideVisibility={true}
      />
    )}
  </div>
));

export default UserCard;
