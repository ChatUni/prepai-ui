import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import CardEditActions from '../../ui/CardEditActions';
import Toggle from '../../ui/Toggle';
import store from '../../../stores/userStore';
import { t } from '../../../stores/languageStore';

const UserCard = observer(({ user, isProfile }) => {
  const navigate = useNavigate();

  return (
  <div className="relative w-full">
    {/* Role Toggle - Top Right */}
    {!isProfile && store.isAdminMode && (
      <div className="absolute top-0 right-0 flex items-center gap-2">
        <span className="text-xs text-gray-600">
          {t('user.subAdmin')}
        </span>
        <Toggle
          checked={user.role === 'sub'}
          onChange={() => store.toggleRole(user)}
        />
      </div>
    )}

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
        <p className="text-gray-600 text-sm">{`${t('user.phone')}: ${user.phone}`}</p>
        <p className="text-gray-600 text-sm">ID: {user.id}</p>
        {isProfile && (
          <>
            <p className="text-green-600 text-sm">
              {t('menu.account_page.membership_expires')}: {store.getExpireDate('membership')?.toLocaleDateString()}
            </p>
            <p className={`text-sm ${store.getRemainingDays('membership') < 5 ? 'text-red-600' : 'text-blue-600'}`}>
              {t('menu.account_page.membership_remaining')}: {store.getRemainingDays('membership')}
            </p>
            <button
              onClick={() => navigate('/memberships')}
              className="text-blue-600 hover:text-blue-800 text-sm underline mt-1"
            >
              {t('membership.title')}
            </button>
          </>
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
  );
});

export default UserCard;
