import { useState, useEffect } from 'react';

export function usePoolData() {
  // Mock data for UI development
  return {
    maxBorrowAmount: 10000,
    borrowAPY: 4.32,
    supplyAPY: 2.87,
    totalValueLocked: 8400000,
    ethPrice: 2489.55
  };
}
