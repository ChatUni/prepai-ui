import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import CardEditActions from '../../ui/CardEditActions';
import Toggle from '../../ui/Toggle';
import store from '../../../stores/userStore';
import { t } from '../../../stores/languageStore';
import ActionButton from '../../ui/ActionButton';
import { FiEdit } from 'react-icons/fi';
import Icon from '../../ui/Icon';

const UserCard = observer(({ user, isProfile }) => {
  const navigate = useNavigate();

  isProfile = isProfile && !store.isSuperAdmin;

  const MemberInfo = ({ content }) => {
    const type = `${content}_member`
    return (
      <>
        <p className="text-lg font-semibold mt-4">{t(`order.types.${type}`)}</p>
        <p className="text-green-600 text-sm">
          {t('menu.account_page.membership_expires')}: {store.getExpireDate(type)?.toLocaleDateString()}
        </p>
        <p className={`text-sm ${store.getRemainingDays(type) < 5 ? 'text-red-600' : 'text-blue-600'}`}>
          {t('menu.account_page.membership_remaining')}: {store.getRemainingDays(type)}
        </p>
        <button
          onClick={() => navigate(`/memberships?content=${content}`)}
          className="text-blue-600 hover:text-blue-800 text-sm underline mt-1"
        >
          {t('membership.title')}
        </button>
      </>
    )
  }

  return (
  <div className="relative w-full">
    {/* Role Toggle - Top Right */}
    {!isProfile && store.isSettingRoute && (
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

    <div className="flex items-start">
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
            <MemberInfo content="text" />
            <MemberInfo content="video" />
          </>
        )}
      </div>

      {isProfile && (
        <div className="flex-grow flex justify-end m-1">
          <Icon icon={FiEdit} color="green" onClick={() => store.openEditDialog(user)} />
        </div>
      )}
    </div>

  </div>
  );
});

export default UserCard;

    /* <button
      onClick={() => navigate('/memberships')}
      className="text-blue-600 hover:text-blue-800 text-sm underline mt-1"
    >
      {t('membership.title')}
    </button> */
