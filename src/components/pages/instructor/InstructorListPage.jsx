import { observer } from 'mobx-react-lite';
import store from '../../../stores/instructorStore';
import ListPage from '../../ui/ListPage';
import EditInstructorPage from './EditInstructorPage';

const InstructorListPage = observer(() => (
  <div className="flex flex-col bg-gray-100 w-full max-w-6xl mx-auto">
    <div className="bg-white">
      <ListPage
        isGrouped={false}
        showSearchBar={false}
        showShortcutButtons={false}
        store={store}
        renderEdit={() => <EditInstructorPage />}
        renderItem={(instructor) => <div>{instructor.name}</div>}
      />
    </div>
  </div>
));

export default InstructorListPage;