import { observer } from 'mobx-react-lite';
import store from '../../../stores/questionStore';
import FormInput from '../../ui/FormInput';
import ImageUpload from '../../ui/ImageUpload';

const EditExamPage = observer(() => (
  <div className="space-y-4">
    <FormInput store={store} field="name" required />
    <ImageUpload store={store} field="cover" />
    <FormInput store={store} field="desc" rows={4} />
  </div>
));

export default EditExamPage;


//            uploadPath={`Exams/${store.editingItem.id || 'new'}`}
