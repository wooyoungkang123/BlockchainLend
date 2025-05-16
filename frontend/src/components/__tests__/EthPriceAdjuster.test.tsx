import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EthPriceAdjuster } from '../EthPriceAdjuster';

// Mock useWalletData hook
const mockUpdateEthPrice = jest.fn();
jest.mock('../../hooks/useWalletData', () => ({
  useWalletData: () => ({
    walletData: {
      ethPrice: 200000000, // $2000 with 8 decimals
    },
    updateEthPrice: mockUpdateEthPrice,
  }),
}));

describe('EthPriceAdjuster', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders with default price input', () => {
    render(<EthPriceAdjuster />);
    
    // Price input should be defaulted to "2000"
    const inputElement = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(inputElement.value).toBe('2000');
    
    // Current price should be displayed
    expect(screen.getByText('Current: $2000.00')).toBeInTheDocument();
  });
  
  it('updates price input when user types', () => {
    render(<EthPriceAdjuster />);
    
    const inputElement = screen.getByRole('spinbutton') as HTMLInputElement;
    
    // Change the input value to 2500
    fireEvent.change(inputElement, { target: { value: '2500' } });
    
    // Input should reflect the new value
    expect(inputElement.value).toBe('2500');
  });
  
  it('updates ETH price when update button is clicked', () => {
    render(<EthPriceAdjuster />);
    
    const inputElement = screen.getByRole('spinbutton') as HTMLInputElement;
    const updateButton = screen.getByText('Update');
    
    // Change the input value to 2500
    fireEvent.change(inputElement, { target: { value: '2500' } });
    
    // Click the update button
    fireEvent.click(updateButton);
    
    // Should call updateEthPrice with the new value (converted to Chainlink format)
    expect(mockUpdateEthPrice).toHaveBeenCalledWith(250000000); // $2500 with 8 decimals
  });
  
  it('does not update ETH price for invalid inputs', () => {
    render(<EthPriceAdjuster />);
    
    const inputElement = screen.getByRole('spinbutton') as HTMLInputElement;
    const updateButton = screen.getByText('Update');
    
    // Test with negative value
    fireEvent.change(inputElement, { target: { value: '-100' } });
    fireEvent.click(updateButton);
    expect(mockUpdateEthPrice).not.toHaveBeenCalled();
    
    // Test with zero
    fireEvent.change(inputElement, { target: { value: '0' } });
    fireEvent.click(updateButton);
    expect(mockUpdateEthPrice).not.toHaveBeenCalled();
    
    // Test with non-numeric input
    fireEvent.change(inputElement, { target: { value: 'abc' } });
    fireEvent.click(updateButton);
    expect(mockUpdateEthPrice).not.toHaveBeenCalled();
  });
}); 