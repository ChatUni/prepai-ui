import { observer } from 'mobx-react-lite';
import store from '../../../stores/assistantStore';
import AssistantCard from './AssistantCard';
import ListPage from '../../ui/ListPage';
import EditAssistantPage from './EditAssistantPage';
import PaymentManager from '../../ui/PaymentManager';

const AssistantPage = observer(() => (
  <>
    <ListPage
      store={store}
      isGrouped={true}
      renderEdit={() => <EditAssistantPage />}
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
    <PaymentManager />
  </>
));

export default AssistantPage;