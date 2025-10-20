import { observer } from 'mobx-react-lite';
import store from '../../../stores/userStore';
import ImageUpload from '../../ui/ImageUpload';
import FormInput from '../../ui/FormInput';
import VerificationDialog from '../../ui/VerificationDialog';
import { t } from '../../../stores/languageStore';

const EditUserPage = observer(() => (
  <div className="space-y-4">
    <FormInput store={store} field="name" />
    <FormInput store={store} field="phone" type="tel" />
    <FormInput store={store} field="email" type="email" />
    <ImageUpload store={store} field="avatar" imageStyle="round" />
    
    <VerificationDialog
      isOpen={store.verificationDialog.isOpen}
      onClose={() => store.closeVerificationDialog()}
      onVerify={(phoneCode, emailCode) => store.handleVerifyCode(phoneCode, emailCode)}
      onResend={(resendType) => store.handleResendCode(resendType)}
      type={store.verificationDialog.type}
      contact={store.verificationDialog.contact}
      phone={store.verificationDialog.phone}
      email={store.verificationDialog.email}
      error={store.verificationDialog.error}
      isLoading={store.verificationDialog.isLoading}
    />
  </div>
));

export default EditUserPage;