import { observer } from 'mobx-react-lite';
import store from '../../../stores/userStore';
import ListPage from '../../ui/ListPage';
import EditUserPage from './EditUserPage';

const UserListPage = observer(() => (
  <div className="flex flex-col bg-gray-100 w-full max-w-6xl mx-auto">
    <div className="bg-white">
      <ListPage
        isGrouped={false}
        showShortcutButtons={false}
        store={store}
        renderEdit={() => <EditUserPage />}
        renderItem={(instructor) => <div>{instructor.name}</div>}
      />
    </div>
  </div>
));

export default UserListPage;