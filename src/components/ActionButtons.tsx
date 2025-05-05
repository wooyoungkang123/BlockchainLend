import { useAccount } from 'wagmi';
import { useLendingPool } from '../hooks/useLendingPool';
import type { ModalType } from './ModalHost';

interface ActionButtonsProps {
  openModal: (modal: ModalType) => void;
}

const ActionButtons = ({ openModal }: ActionButtonsProps) => {
  const { address } = useAccount();
  const { getUserAccountData } = useLendingPool();
  
  // Get user's account data
  const { data: accountData } = getUserAccountData(address || '0x0000000000000000000000000000000000000000');
  
  // Type guard for account data
  const isValidAccountData = (data: unknown): data is { 0: bigint; 1: bigint; 2: bigint; 3: bigint } => {
    return !!data && typeof data === 'object' && '0' in data && '1' in data && '2' in data;
  };
  
  // Determine if user has any deposits
  const hasDeposits = (): boolean => {
    if (!isValidAccountData(accountData)) return false;
    return Number(accountData[0]) > 0;
  };
  
  // Determine if user has any borrows
  const hasBorrows = (): boolean => {
    if (!isValidAccountData(accountData)) return false;
    return Number(accountData[1]) > 0;
  };
  
  // Determine if user's position is liquidatable
  const isLiquidatable = (): boolean => {
    if (!isValidAccountData(accountData)) return false;
    return Number(accountData[2]) < 100; // Health factor below 100%
  };

  return (
    <div className="action-buttons">
      <button 
        className="action-button deposit"
        onClick={() => openModal('deposit')}
      >
        Deposit
      </button>
      
      <button 
        className="action-button borrow"
        onClick={() => openModal('borrow')}
        disabled={!hasDeposits()}
        title={!hasDeposits() ? "Deposit collateral first" : ""}
      >
        Borrow
      </button>
      
      {hasBorrows() && (
        <button 
          className={`action-button ${isLiquidatable() ? 'liquidate' : 'repay'}`}
          onClick={() => openModal('repay')}
        >
          {isLiquidatable() ? 'Liquidate' : 'Repay'}
        </button>
      )}
    </div>
  );
};

export default ActionButtons; 