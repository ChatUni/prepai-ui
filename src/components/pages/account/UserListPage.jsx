import { observer } from 'mobx-react-lite';
import store from '../../../stores/userStore';
import ListPage from '../../ui/ListPage';
import EditUserPage from './EditUserPage';
import UserCard from './UserCard';

const UserListPage = observer(({ showSearchBar, hideList }) => (
  <div className="flex flex-col bg-gray-100 w-full max-w-6xl mx-auto">
    <div className="bg-white p-4">
      {!hideList &&
        <ListPage
          isGrouped={false}
          showSearchBar={showSearchBar}
          showShortcutButtons={false}
          store={store}
          renderEdit={() => <EditUserPage />}
          renderItem={(user) => <UserCard user={user} />}
        />
      }
    </div>
  </div>
));

export default UserListPage;