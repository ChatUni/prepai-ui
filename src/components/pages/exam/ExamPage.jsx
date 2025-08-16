import { observer } from 'mobx-react-lite';
import store from '../../../stores/examStore';
import ExamCard from './ExamCard';
import ListPage from '../../ui/ListPage';
import EditExamPage from './EditExamPage';
import PaymentManager from '../../ui/PaymentManager';

const ExamPage = observer(() => (
  <>
    <ListPage
      store={store}
      isGrouped={true}
      renderEdit={() => <EditExamPage />}
      renderItem={(exam, index, group, { moveItem, isEditMode }, isFirstCard) => (
        <ExamCard
          key={exam.id}
          exam={exam}
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

export default ExamPage;