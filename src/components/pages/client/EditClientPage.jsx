import { observer } from 'mobx-react-lite';
import store from '../../../stores/clientStore';
import FormInput from '../../ui/FormInput';
import ImageUpload from '../../ui/ImageUpload';
import PageTitle from '../../ui/PageTitle';
import { t } from '../../../stores/languageStore';
import Page from '../../ui/Page';
import FormRadio from '../../ui/FormRadio';

const EditClientPage = observer(({ mode }) => (
  <Page store={store} editItem={store.client}>
    <PageTitle title={t(`menu.admin_page.${mode || 'basic'}_settings`)} />
    {mode === 'advanced' ? (
      <FormRadio store={store} field="allowFree1Day" options={store.yesNoOptions} defaultValue={false} />
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
));

export default EditClientPage;