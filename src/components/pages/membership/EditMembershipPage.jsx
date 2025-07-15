import React from 'react';
import { observer } from 'mobx-react-lite';
import { t } from '../../../stores/languageStore';
import store from '../../../stores/membershipStore';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';

const EditMembershipPage = observer(() => (
  <div className="space-y-4">
    <FormInput store={store} field="name" />
    <FormSelect store={store} field="type" options={store.membershipTypes} />
    <FormInput store={store} field="price" type="number" />
    <FormInput store={store} field="orig_price" type="number" />
    <FormInput store={store} field="desc" rows={5} />
  </div>
));

const EditMembershipPage1 = observer(() => {
  const typeOptions = store.membershipTypes
    .filter(type => type.value !== 'all')
    .map(type => ({
      value: type.value,
      label: t(type.label)
    }));

  return (
    <div className="space-y-4">
      {/* Name Input */}
      <FormInput
        id="membershipName"
        label={t('membership.name')}
        value={store.editingMembership.name || ''}
        onChange={handleNameChange}
        required
      />

      {/* Type Dropdown */}
      <FormSelect
        id="membershipType"
        label={t('membership.type')}
        value={store.editingType || ''}
        onChange={handleTypeChange}
        options={typeOptions}
        placeholder={t('membership.types.all')}
        required
      />

      {/* Price and Original Price in same row */}
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          id="membershipPrice"
          label={t('membership.price')}
          value={store.editingMembership.price || ''}
          onChange={handlePriceChange}
          type="number"
          min="0"
          required
        />
        <FormInput
          id="membershipOriginalPrice"
          label={t('membership.originalPrice')}
          value={store.editingMembership.orig_price || ''}
          onChange={handleOriginalPriceChange}
          type="number"
          min="0"
        />
      </div>

      {/* Description Input */}
      <FormInput
        id="membershipDescription"
        label={t('membership.description')}
        value={store.editingMembership.desc || ''}
        onChange={handleDescriptionChange}
        rows={3}
      />
    </div>
  );
});

export default EditMembershipPage;