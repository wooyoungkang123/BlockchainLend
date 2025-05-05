import { useEffect } from 'react';
import DepositModal from './modals/DepositModal';
import BorrowModal from './modals/BorrowModal';
import RepayModal from './modals/RepayModal';

export type ModalType = 'deposit' | 'borrow' | 'repay' | 'liquidate' | null;

interface ModalHostProps {
  modalType: ModalType;
  closeModal: () => void;
}

const ModalHost = ({ modalType, closeModal }: ModalHostProps) => {
  // Close modal on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (modalType) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [modalType]);

  if (!modalType) return null;

  // Modal backdrop that closes when clicked
  return (
    <div 
      className="modal-backdrop" 
      onClick={(e) => {
        // Only close if clicking the backdrop, not modal content
        if (e.target === e.currentTarget) {
          closeModal();
        }
      }}
    >
      {modalType === 'deposit' && <DepositModal onClose={closeModal} />}
      {modalType === 'borrow' && <BorrowModal onClose={closeModal} />}
      {modalType === 'repay' && <RepayModal onClose={closeModal} />}
      {modalType === 'liquidate' && <RepayModal onClose={closeModal} isLiquidation={true} />}
    </div>
  );
};

export default ModalHost; 