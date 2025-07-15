import { observer } from 'mobx-react-lite';
import store from '../../../stores/instructorStore';
import ImageUpload from '../../ui/ImageUpload';
import FormInput from '../../ui/FormInput';

const EditInstructorPage = observer(() => (
  <div className="space-y-4">
    <FormInput store={store} field="name" />
    <FormInput store={store} field="title" />
    <FormInput store={store} field="bio" rows={5} />
    <FormInput store={store} field="expertise" rows={5} />
    <ImageUpload store={store} field="image" imageStyle="round" />
  </div>
));

export default EditInstructorPage;