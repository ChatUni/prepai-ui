import { observer } from 'mobx-react-lite';
import EditContainer from '../../ui/PageEditContainer';
import store from '../../../stores/clientStore';
import FormInput from '../../ui/FormInput';
import ImageUpload from '../../ui/ImageUpload';
import PageTitle from '../../ui/PageTitle';
import ConfirmButtons from '../../ui/ConfirmButtons';
import { t } from '../../../stores/languageStore';
import PageEditContainer from '../../ui/PageEditContainer';

const EditClientPage = observer(() => (
  <PageEditContainer store={store}>
    <PageTitle title={t('menu.admin_page.basic_settings')} />
    <FormInput store={store} field="name" required />
    <FormInput store={store} field="desc" rows={3} />
    <ImageUpload store={store} field="logo" />
  </PageEditContainer>
));

export default EditClientPage;