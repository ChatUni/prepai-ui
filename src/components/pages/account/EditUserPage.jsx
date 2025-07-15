import { observer } from 'mobx-react-lite';
import store from '../../../stores/userStore';
import ImageUpload from '../../ui/ImageUpload';
import FormInput from '../../ui/FormInput';

const EditUserPage = observer(() => (
  <div className="space-y-4">
    <FormInput store={store} field="name" />
    <ImageUpload store={store} field="avatar" imageStyle="round" />
  </div>
));

export default EditUserPage;