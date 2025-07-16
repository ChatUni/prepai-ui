import { observer } from 'mobx-react-lite';
import EditContainer from '../../ui/PageEditContainer';
import store from '../../../stores/clientStore';
import FormInput from '../../ui/FormInput';
import ImageUpload from '../../ui/ImageUpload';
import PageTitle from '../../ui/PageTitle';
import ConfirmButtons from '../../ui/ConfirmButtons';
import { t } from '../../../stores/languageStore';
import PageEditContainer from '../../ui/PageEditContainer';
import FormRadio from '../../ui/FormRadio';

const EditClientPage = observer(() => (
  <PageEditContainer store={store} item={store.client}>
    <PageTitle title={t('menu.admin_page.basic_settings')} />
    <FormInput store={store} field="name" />
    <FormInput store={store} field="desc" rows={3} />
    <ImageUpload store={store} field="logo" />
    <FormInput store={store} field="phone" />
    <FormInput store={store} field="email" />
    <ImageUpload store={store} field="qrcode" />
  </PageEditContainer>
));

export default EditClientPage;