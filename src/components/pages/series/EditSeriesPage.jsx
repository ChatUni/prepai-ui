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
  () => <FormSelect store={store} field="group" options={clientStore.client.settings.seriesGroups} />,

  () => (
    <div className="space-y-6">
      <FormInput store={store} field="name" />
      <FormInput store={store} field="category" choices={store.uniqueCategories} />
    </div>
  ),

  () => <ImageUpload store={store} field="image" />,

  () => (
    <>
      <FormRadio store={store} field="descType"
        options={['text', 'image'].map(type => ({
          value: type,
          label: t(`series.descType${type[0].toUpperCase() + type.slice(1)}`)
        }))}
      />

      {store.editingItem.descType === 'text'
        ? <FormInput store={store} field="desc" rows={10} hasTitle={false} />
        : <ImageUpload store={store} field="desc" hasTitle={false} />
      }
    </>
  ),

  () => (
    <div className="space-y-6">
      <FormInput store={store} field="price" type="number" />
      <FormSelect store={store} field="duration" options={store.durationOptions} />
    </div>
  ),

  () => (
    <div className="space-y-2">
      <CourseListPage series={store.editingItem} />
    </div>
  )
].map(x => observer(x));

const EditSeriesPage = ({ step }) => {
  const Step = steps[step - 1];
  return <Step />;
}

export default EditSeriesPage;