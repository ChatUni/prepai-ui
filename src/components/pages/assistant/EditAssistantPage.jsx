import { observer } from 'mobx-react-lite';
import store from '../../../stores/assistantStore';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
import ImageUpload from '../../ui/ImageUpload';

const EditAssistantPage = observer(() => (
  <div className="space-y-4">
    <FormInput store={store} field="name" required />

    {!store.isPlatformAssistant && (
      <>
        <FormInput store={store} field="greeting" rows={4} />
        <FormInput store={store} field="prompt" rows={10} required />
        <FormSelect store={store} field="model" options={store.modelOptions} required />
        <FormSelect store={store} field="group" options={store.groupOptions} required />
        <ImageUpload store={store} field="image" />
      </>
    )}
  </div>
));

export default EditAssistantPage;
