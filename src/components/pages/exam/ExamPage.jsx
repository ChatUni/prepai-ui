import { observer } from 'mobx-react-lite';
import store from '../../../stores/questionStore';
import ExamCard from './ExamCard';
import ListPage from '../../ui/ListPage';
import EditExamPage from './EditExamPage';

const ExamPage = observer(() => (
  <div className="flex flex-col bg-gray-100 w-full max-w-6xl mx-auto">
    <div className="bg-white p-4">
      <ListPage
        store={store}
        editDialogChildren={<EditExamPage />}
        renderItem={(exam, index, group, { moveItem, isEditMode }, isFirstCard) => (
          <ExamCard
            key={exam.id}
            Exam={exam}
            index={index}
            group={group}
            moveItem={moveItem}
            isEditMode={isEditMode}
            renderDialogs={isFirstCard}
          />
        )}
      />
    </div>
  </div>
));

export default ExamPage;