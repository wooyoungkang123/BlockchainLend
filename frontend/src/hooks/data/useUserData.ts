import { useState, useEffect } from 'react';

export function useUserData() {
  // Mock data for UI development
  return {
    collateralBalance: 1.2,
    borrowedAmount: 1500,
    healthFactor: 1.75,
    interestEarned: 0.04,
    interestAccrued: 50.25
  };
}
