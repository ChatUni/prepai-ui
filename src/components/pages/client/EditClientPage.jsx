import { observer } from 'mobx-react-lite';
import store from '../../../stores/clientStore';
import FormInput from '../../ui/FormInput';
import ImageUpload from '../../ui/ImageUpload';
import PageTitle from '../../ui/PageTitle';
import ConfirmButtons from '../../ui/ConfirmButtons';
import { t } from '../../../stores/languageStore';

const EditClientPage = observer(() => (
  <div className="space-y-4">
    <div className="p-6 space-y-4">
      <PageTitle title={t('menu.admin_page.basic_settings')} />
      <FormInput store={store} field="name" required />
      <FormInput store={store} field="desc" rows={3} />
      <ImageUpload store={store} field="logo" />
    </div>
    <ConfirmButtons
      isConfirm={true}
      onConfirm={() => store.save()}
      onClose={() => store.cancel()}
    />
  </div>
));

export default EditClientPage;