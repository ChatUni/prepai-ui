import React from 'react';
import { observer } from 'mobx-react-lite';
import languageStore from '../../../stores/languageStore';
import membershipStore from '../../../stores/membershipStore';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';

const EditMembershipPage = observer(() => {
  const { t } = languageStore;

  const handleNameChange = (e) => {
    membershipStore.setEditingMembershipName(e.target.value);
  };

  const handleTypeChange = (e) => {
    membershipStore.setEditingMembershipType(e.target.value);
  };

  const handlePriceChange = (e) => {
    membershipStore.setEditingMembershipPrice(e.target.value);
  };

  const handleOriginalPriceChange = (e) => {
    membershipStore.setEditingMembershipOriginalPrice(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    membershipStore.setEditingMembershipDescription(e.target.value);
  };

  const typeOptions = membershipStore.membershipTypes
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
        value={membershipStore.editingMembership.name || ''}
        onChange={handleNameChange}
        required
      />

      {/* Type Dropdown */}
      <FormSelect
        id="membershipType"
        label={t('membership.type')}
        value={membershipStore.editingType || ''}
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
          value={membershipStore.editingMembership.price || ''}
          onChange={handlePriceChange}
          type="number"
          min="0"
          required
        />
        <FormInput
          id="membershipOriginalPrice"
          label={t('membership.originalPrice')}
          value={membershipStore.editingMembership.orig_price || ''}
          onChange={handleOriginalPriceChange}
          type="number"
          min="0"
        />
      </div>

      {/* Description Input */}
      <FormInput
        id="membershipDescription"
        label={t('membership.description')}
        value={membershipStore.editingMembership.desc || ''}
        onChange={handleDescriptionChange}
        rows={3}
      />
    </div>
  );
});

export default EditMembershipPage;