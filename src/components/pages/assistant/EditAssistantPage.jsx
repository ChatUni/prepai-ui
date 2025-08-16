import { observer } from 'mobx-react-lite';
import store from '../../../stores/assistantStore';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
import ImageUpload from '../../ui/ImageUpload';

const EditAssistantPage = observer(() => (
  <div className="space-y-4">
    <FormInput store={store} field="name" />
    <FormInput store={store} field="desc" rows={4} />
    <FormInput store={store} field="greeting" rows={4} />

    {!store.isPlatformAssistant() && (
      <>
        <FormInput store={store} field="prompt" rows={10} />
        <FormSelect store={store} field="model" options={store.modelOptions} />
      </>
    )}

    <FormSelect store={store} field="group" options={store.groupOptions} />
    <ImageUpload store={store} field="image" collections={store.imageCollections} />
  </div>
));

export default EditAssistantPage;
