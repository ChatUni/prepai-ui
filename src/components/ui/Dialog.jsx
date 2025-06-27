import { observer } from 'mobx-react-lite';
import { createPortal } from 'react-dom';
import useDialogOverflow from '../../hooks/useDialogOverflow';
import ConfirmButtons from './ConfirmButtons';

const Dialog = observer(({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  isConfirm = false
}) => {
  useDialogOverflow(isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
          {title && (
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium">{title}</h3>
            </div>
          )}
          <div className="px-6 py-4">
            {children}
          </div>
          <ConfirmButtons
            isConfirm={isConfirm}
            onClose={onClose}
            onConfirm={onConfirm}
          />
        </div>
      </div>
    </div>,
    document.body
  );
});

export default Dialog;