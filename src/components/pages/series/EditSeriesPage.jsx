import { observer } from 'mobx-react-lite';
import { t } from '../../../stores/languageStore';
import clientStore from '../../../stores/clientStore';
import store from '../../../stores/seriesStore';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
import FormRadio from '../../ui/FormRadio';
import ImageUpload from '../../ui/ImageUpload';
import CourseListPage from './CourseListPage';

const steps = [
  () => <FormSelect store={store} field="group" options={clientStore.client.settings.seriesGroups} required />,

  () => (
    <div className="space-y-6">
      <FormInput store={store} field="name" required />
      <FormInput store={store} field="category" choices={store.uniqueCategories} required />
    </div>
  ),

  () => <ImageUpload store={store} field="image" required />,

  () => (
    <>
      <FormRadio store={store} field="descType"
        options={['text', 'image'].map(type => ({
          value: type,
          label: t(`series.descType${type[0].toUpperCase() + type.slice(1)}`)
        }))}
      />

      {store.editingItem.descType === 'text'
        ? <FormInput store={store} field="desc" rows={10} required hasTitle={false} />
        : <ImageUpload store={store} field="desc" required hasTitle={false} />
      }
    </>
  ),

  () => (
    <div className="space-y-6">
      <FormInput store={store} field="price" type="number" required />
      <FormSelect store={store} field="duration" options={store.durationOptions} required />
    </div>
  ),

  () => (
    <div className="space-y-2">
      <CourseListPage series={store.editingItem} />
    </div>
  )
].map(observer);

const EditSeriesPage = ({ step }) => {
  const Step = steps[step - 1];
  return <Step />;
}

export default EditSeriesPage;