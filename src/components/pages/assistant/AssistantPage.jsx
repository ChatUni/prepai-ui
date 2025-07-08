import { observer } from 'mobx-react-lite';
import store from '../../../stores/assistantStore';
import AssistantCard from './AssistantCard';
import ListPage from '../../ui/ListPage';
import EditAssistantPage from './EditAssistantPage';
import PaymentManager from '../../ui/PaymentManager';

const AssistantPage = observer(() => (
  <div className="flex flex-col bg-gray-100 w-full max-w-6xl mx-auto">
    <div className="bg-white p-4">
      <ListPage
        store={store}
        editDialogChildren={<EditAssistantPage />}
        renderItem={(assistant, index, group, { moveItem, isEditMode }, isFirstCard) => (
          <AssistantCard
            key={assistant.id}
            assistant={assistant}
            index={index}
            group={group}
            moveItem={moveItem}
            isEditMode={isEditMode}
            renderDialogs={isFirstCard}
          />
        )}
      />
    </div>
    <PaymentManager />
  </div>
));

export default AssistantPage;