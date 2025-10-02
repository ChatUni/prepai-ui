import { observer } from 'mobx-react-lite';
import store from '../../../stores/assistantStore';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
import ImageUpload from '../../ui/ImageUpload';
import userStore from '../../../stores/userStore';
import { t } from '../../../stores/languageStore';
import { range } from '../../../utils/utils';

const Param = ({ idx }) => (
  <div className="space-y-4">
    <div>{t('assistant.param.var')} {idx}</div>
    <FormInput store={store} field={`p${idx}_name`} label={t('assistant.param.name')} />
    <FormSelect store={store} field={`p${idx}_type`} label={t('assistant.param.type')} options={['select', 'radio', 'image', 'video']} placeholder=" " />
    <FormInput store={store} field={`p${idx}_options`} label={t('assistant.param.options')} />
    <FormSelect store={store} field={`p${idx}_mode`} label={t('assistant.param.mode')} options={['dropdown', 'card', 'row']} placeholder=" " />
    <FormInput store={store} field={`p${idx}_default`} label={t('assistant.param.default')} />
    <FormInput store={store} field={`p${idx}_title`} label={t('assistant.param.title')} />
    <FormInput store={store} field={`p${idx}_cols`} label={t('assistant.param.cols')} type='number' />
  </div>
)

const EditAssistantPage = observer(() => (
  <div className="space-y-4">
    <FormInput store={store} field="name" />
    <FormInput store={store} field="desc" rows={4} />
    <FormInput store={store} field="greeting" rows={4} />
    <FormInput store={store} field="placeholder" />

    {(userStore.isSuperAdmin || !store.isPlatformAssistant()) && (
      <>
        <FormInput store={store} field="prompt" rows={10} />
        <FormSelect store={store} field="model" options={store.modelOptions} />
      </>
    )}

    <FormSelect store={store} field="group" options={store.getGroups()} />
    <ImageUpload store={store} field="image" collections={store.imageCollections} round={true} />

    {userStore.isSuperAdmin && (
      <>
        <FormInput store={store} field="workflow_id" />
        <FormSelect store={store} field="result" options={store.resultOptions} />
        {range(1, 5).map(x => <Param idx={x} />)}
      </>
    )}
  </div>
));

export default EditAssistantPage;
