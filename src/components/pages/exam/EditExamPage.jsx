import { observer } from 'mobx-react-lite';
import store from '../../../stores/examStore';
import FormInput from '../../ui/FormInput';
import ImageUpload from '../../ui/ImageUpload';
import clientStore from '../../../stores/clientStore';
import FormSelect from '../../ui/FormSelect';
import { TOS } from '../../../utils/const';

const EditExamPage = observer(() => (
  <div className="space-y-4">
    <FormInput store={store} field="name" />
    <FormSelect store={store} field="group" options={clientStore.client.settings.examGroups} />
    <ImageUpload store={store} field="image" />
    <FormInput store={store} field="desc" rows={4} />
    <ImageUpload
      store={store}
      type="document"
      field="upload_file"
      template={`${TOS}common/question_template.docx`}
    />
  </div>
));

export default EditExamPage;


//            uploadPath={`Exams/${store.editingItem.id || 'new'}`}
