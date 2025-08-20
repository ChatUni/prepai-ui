import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { t } from '../../../stores/languageStore';
import membershipStore from '../../../stores/membershipStore';
import DndOrderContainer from '../../ui/DndOrderContainer';
import CardEditActions from '../../ui/CardEditActions';

const formatPrice = (price, originalPrice) => {
  if (originalPrice && originalPrice !== price) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-red-600 font-bold text-lg">¥{price}</span>
        <span className="text-gray-400 line-through text-sm">¥{originalPrice}</span>
      </div>
    );
  }
  return <span className="text-red-600 font-bold text-lg">¥{price}</span>;
};

const MembershipCard = observer(({
  membership,
  isEditMode = false,
  index,
  moveItem,
  onEdit,
  onDelete,
  onClick
}) => {
  const handleCardClick = useCallback((e) => {
    // Don't trigger card click if clicking on action buttons
    if (isEditMode && e.target.closest('.action-button')) {
      return;
    }
    if (onClick) {
      onClick(membership);
    }
  }, [isEditMode, onClick, membership]);

  return (
    <DndOrderContainer
      isEditMode={isEditMode}
      type="membership"
      index={index}
      moveItem={moveItem}
      onDrop={membershipStore.saveMembershipOrder}
      onClick={handleCardClick}
      isClickable={!isEditMode}
    >
      <div className="p-4">
        {/* Header with name and type */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {membership.name}
            </h3>
            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {t(`membership.types.${membership.type}`)}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="mb-3">
          {formatPrice(membership.price, membership.orig_price)}
        </div>

        {/* Description */}
        {membership.desc && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {membership.desc}
          </p>
        )}
      </div>

      {/* Action buttons for edit mode */}
      {isEditMode && (
        <CardEditActions
          item={membership}
          store={membershipStore}
          onTop={true}
        />
      )}
    </DndOrderContainer>
  );
});

export default MembershipCard;