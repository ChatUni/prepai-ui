import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import store from '../../../stores/clientStore';
import FormInput from '../../ui/FormInput';
import ImageUpload from '../../ui/ImageUpload';
import PageTitle from '../../ui/PageTitle';
import { t } from '../../../stores/languageStore';
import Page from '../../ui/Page';
import FormRadio from '../../ui/FormRadio';

const EditClientPage = observer(({ mode }) => {
  const navigate = useNavigate();

  const handleNavigateBack = () => store.navigateBackToAdmin(navigate);

  // Override the confirmEdit method to navigate back after saving
  const handleConfirm = async () => {
    await store.confirmEdit(false, false); // don't reload, don't close dialog
    handleNavigateBack();
  };

  return (
    <Page
      store={store}
      editItem={store.client}
      onClose={handleNavigateBack}
      onConfirm={handleConfirm}
    >
      <PageTitle title={t(`menu.admin_page.${mode || 'basic'}_settings`)} />
      {mode === 'advanced' ? (
        <>
          <FormRadio store={store} field="allowFree1Day" options={store.yesNoOptions} defaultValue={false} />
          <FormRadio store={store} field="hideSeries" options={store.yesNoOptions} defaultValue={false} />
          <FormRadio store={store} field="hideExam" options={store.yesNoOptions} defaultValue={false} />
        </>
      ) : (
        <>
          <FormInput store={store} field="name" />
          <FormInput store={store} field="desc" rows={3} />
          <ImageUpload store={store} field="logo" />
          <FormInput store={store} field="phone" />
          <FormInput store={store} field="email" />
          <ImageUpload store={store} field="qrcode" />
        </>
      )}
    </Page>
  );
});

export default EditClientPage;