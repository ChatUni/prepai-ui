import { observer } from 'mobx-react-lite';
import lang from '../../../stores/languageStore';
import ActionButton from '../../ui/ActionButton';

const membershipTypes = [
  "monthly",
  "annually",
  "lifetime",
  "trial"
]

const getTypeLabel = (type) => lang.t(`membership.types.${membershipTypes[type]}`) || type;

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

const MembershipCard = observer(({ membership, onEdit, onDelete }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
    <div className="p-4">
      {/* Header with name and type */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {membership.name}
          </h3>
          <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {getTypeLabel(membership.type)}
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
));

export default MembershipCard;