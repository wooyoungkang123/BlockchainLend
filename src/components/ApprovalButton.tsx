import { useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { LENDING_POOL_ADDRESS, LENDING_TOKEN_ADDRESS } from '../contracts/config';
import ERC20ABI from '../contracts/ERC20ABI.json';

interface ApprovalButtonProps {
  amount: string;
  onApproved?: () => void;
}

export default function ApprovalButton({ amount, onApproved }: ApprovalButtonProps) {
  const { writeContract, isPending, data: hash } = useWriteContract();

  const handleApprove = async () => {
    try {
      // Add a buffer to the approval amount (20% more than needed)
      const amountToApprove = parseEther(amount || '0');
      const bufferAmount = (amountToApprove * 120n) / 100n;
      
      // Execute the approve transaction
      writeContract({
        address: LENDING_TOKEN_ADDRESS,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [LENDING_POOL_ADDRESS, bufferAmount],
      }, {
        onSuccess: () => {
          if (onApproved) onApproved();
        },
        onError: (error) => {
          console.error('Approval error:', error);
        }
      });
    } catch (error) {
      console.error('Error approving tokens:', error);
    }
  };

  return (
    <div className="approval-action">
      <button 
        className="approval-button" 
        onClick={handleApprove}
        disabled={isPending}
      >
        {isPending ? 'Approving...' : 'Approve Tokens'}
      </button>
      
      {isPending && (
        <span className="approval-status pending">
          Approval transaction pending...
        </span>
      )}
      
      {hash && !isPending && (
        <span className="approval-status success">
          Approval successful!
        </span>
      )}
    </div>
  );
} 