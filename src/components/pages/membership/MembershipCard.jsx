import { observer } from 'mobx-react-lite';
import { MdDragIndicator } from 'react-icons/md';
import lang from '../../../stores/languageStore';
import ActionButton from '../../ui/ActionButton';
import membershipStore from '../../../stores/membershipStore';
import { getCardBaseClasses } from '../../../utils/cardStyles';
import useDragAndDrop from '../../../hooks/useDragAndDrop';

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

const MembershipCard = observer(({ membership, onEdit, onDelete, index, moveMembership, isDraggable = true }) => {
  const { isDragging, isOver, handleRef } = useDragAndDrop({
    type: 'membership',
    index,
    moveItem: (fromIndex, toIndex) => {
      if (moveMembership && isDraggable && fromIndex !== toIndex) {
        moveMembership(fromIndex, toIndex);
      }
    },
    onDrop: () => isDraggable ? membershipStore.saveMembershipOrder() : undefined
  });

  return (
    <div
      ref={isDraggable ? handleRef : undefined}
      className={`${getCardBaseClasses(false, false, false)} ${
        isDragging ? 'opacity-50' : ''
      } ${isOver ? 'border-2 border-blue-400 transform scale-[1.02]' : ''} ${
        isDraggable ? 'cursor-move' : ''
      } transition-all duration-200`}
    >
      <div className="p-4">
        {/* Header with name and type */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {membership.name}
            </h3>
            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {lang.t(membershipStore.getTypeLabel(membership.type))}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ActionButton
              onClick={() => onEdit(membership)}
              icon="FiEdit2"
              title={lang.t('membership.edit')}
              color="orange"
            />
            <ActionButton
              onClick={() => onDelete(membership)}
              icon="FiTrash2"
              title={lang.t('membership.delete')}
              color="red"
            />
            {isDraggable && (
              <div className="text-gray-400 hover:text-gray-600 p-1 rounded bg-gray-100 cursor-move">
                <MdDragIndicator size={20} />
              </div>
            )}
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
    </div>
  );
});

export default MembershipCard;