import { observer } from 'mobx-react-lite';
import store from '../../../stores/membershipStore';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';

const EditMembershipPage = observer(() => (
  <div className="space-y-4">
    <FormInput store={store} field="name" />
    <FormSelect store={store} field="content" options={store.contentTypeOptions} />
    <FormSelect store={store} field="type" options={store.membershipTypeOptions} />
    <FormInput store={store} field="price" type="number" />
    <FormInput store={store} field="orig_price" type="number" />
    <FormInput store={store} field="desc" rows={5} />
  </div>
));

export default EditMembershipPage;