import { observer } from 'mobx-react-lite';
import store from '../../../stores/examStore';
import FormInput from '../../ui/FormInput';
import ImageUpload from '../../ui/ImageUpload';

const EditExamPage = observer(() => (
  <div className="space-y-4">
    <FormInput store={store} field="name" />
    <ImageUpload store={store} field="image" />
    <FormInput store={store} field="desc" rows={4} />
    <ImageUpload
      store={store}
      field="upload_file"
      selectedFile={store.editingItem?.upload_file}
    />
  </div>
));

export default EditExamPage;


//            uploadPath={`Exams/${store.editingItem.id || 'new'}`}
