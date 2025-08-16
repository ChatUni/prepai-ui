import { observer } from 'mobx-react-lite';
import store from '../../../stores/userStore';
import ListPage from '../../ui/ListPage';
import EditUserPage from './EditUserPage';
import UserCard from './UserCard';

const UserListPage = observer(({ showSearchBar, hideList }) => (
  <ListPage
    isGrouped={false}
    showSearchBar={showSearchBar}
    showShortcutButtons={false}
    store={store}
    renderEdit={() => <EditUserPage />}
    renderItem={(user) => <UserCard user={user} />}
  />
));

export default UserListPage;