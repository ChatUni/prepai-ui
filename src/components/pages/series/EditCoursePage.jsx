import { observer } from 'mobx-react-lite';
import seriesStore from '../../../stores/seriesStore';
import store from '../../../stores/courseStore';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
import ImageUpload from '../../ui/ImageUpload';
import FormRadio from '../../ui/FormRadio';
import { t } from '../../../stores/languageStore';

const EditCoursePage = observer(() => (
  <div className="space-y-4">
    <FormSelect store={store} field="instructor_id" options={seriesStore.allInstructors} />
    <FormInput store={store} field="title" />
    <FormRadio store={store} field="isFree" options={[
      { value: true, label: t('common.yes') },
      { value: false, label: t('common.no') }
    ]} />
    <FormInput store={store} field="duration" type="number" min="0" />
    <ImageUpload store={store} field="url" type="video" />
  </div>
));

export default EditCoursePage;
