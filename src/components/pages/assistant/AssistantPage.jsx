import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import store from '../../../stores/assistantStore';
import AssistantCard from './AssistantCard';
import ListPage from '../../ui/ListPage';
import EditAssistantPage from './EditAssistantPage';
import { t } from '../../../stores/languageStore';

const AssistantPage = observer(() => {
  const navigate = useNavigate();

  return (
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
      
      {/* Membership Required Dialog */}
      {store.showMembershipDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => store.setShowMembershipDialog(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="px-6 py-4">
                <h3 className="text-lg font-medium">{t('assistant.membershipRequired.title')}</h3>
              </div>
              <div className="px-6 py-4">
                <p>{t('assistant.membershipRequired.message')}</p>
              </div>
              <div className="px-6 py-4 flex justify-end gap-4">
                <button
                  onClick={() => store.setShowMembershipDialog(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('assistant.membershipRequired.cancel')}
                </button>
                <button
                  onClick={() => store.handleMembershipPurchase(navigate)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('assistant.membershipRequired.purchase')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default AssistantPage;