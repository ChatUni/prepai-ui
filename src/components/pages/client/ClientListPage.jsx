import { observer } from 'mobx-react-lite';
import store from '../../../stores/clientStore';
import ListPage from '../../ui/ListPage';

const ClientListPage = observer(() => (
  <ListPage
    isGrouped={false}
    showSearchBar={false}
    store={store}
    renderItem={(client) => (
      <div>{client.name}</div>
    )}
  />
));

export default ClientListPage;