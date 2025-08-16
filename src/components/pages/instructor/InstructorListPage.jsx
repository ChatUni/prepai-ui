import { observer } from 'mobx-react-lite';
import store from '../../../stores/instructorStore';
import ListPage from '../../ui/ListPage';
import EditInstructorPage from './EditInstructorPage';

const InstructorListPage = observer(() => (
  <ListPage
    isGrouped={false}
    showSearchBar={false}
    showShortcutButtons={false}
    store={store}
    renderEdit={() => <EditInstructorPage />}
    renderItem={(instructor) => <div>{instructor.name}</div>}
  />
));

export default InstructorListPage;