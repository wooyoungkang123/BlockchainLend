#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting test suite for DeFi Lending Protocol${NC}"
echo -e "${YELLOW}===================================================${NC}"

# Create a directory for test results
mkdir -p test_results

# Function to run tests with timing
run_test() {
  TEST_TYPE=$1
  CMD=$2
  
  echo -e "\n${YELLOW}Running $TEST_TYPE tests...${NC}"
  
  # Record start time
  start_time=$(date +%s)
  
  # Run the test and capture output
  OUTPUT_FILE="test_results/${TEST_TYPE}_output.txt"
  if $CMD > "$OUTPUT_FILE" 2>&1; then
    # Calculate elapsed time
    end_time=$(date +%s)
    elapsed=$((end_time - start_time))
    
    # Convert seconds to minutes and seconds
    minutes=$((elapsed / 60))
    seconds=$((elapsed % 60))
    
    echo -e "${GREEN}✓ $TEST_TYPE tests passed in ${minutes}m ${seconds}s${NC}"
    return 0
  else
    # Calculate elapsed time
    end_time=$(date +%s)
    elapsed=$((end_time - start_time))
    
    # Convert seconds to minutes and seconds
    minutes=$((elapsed / 60))
    seconds=$((elapsed % 60))
    
    echo -e "${RED}✗ $TEST_TYPE tests failed in ${minutes}m ${seconds}s${NC}"
    echo -e "${RED}See $OUTPUT_FILE for details${NC}"
    return 1
  fi
}

# 1. Run Hardhat Unit Tests
run_hardhat() {
  run_test "Hardhat" "npx hardhat test"
}

# 2. Run Foundry Unit Tests
run_foundry_unit() {
  run_test "Foundry Unit" "forge test --match-path 'test/*.t.sol' -v"
}

# 3. Run Foundry Invariant Tests
run_foundry_invariant() {
  run_test "Foundry Invariant" "forge test --match-path 'test/invariant/*.t.sol' -v"
}

# Run all test suites and track failures
FAILURES=0

# Run Hardhat tests
if ! run_hardhat; then
  FAILURES=$((FAILURES + 1))
fi

# Run Foundry unit tests
if ! run_foundry_unit; then
  FAILURES=$((FAILURES + 1))
fi

# Run Foundry invariant tests
if ! run_foundry_invariant; then
  FAILURES=$((FAILURES + 1))
fi

# Summary
echo -e "\n${YELLOW}Test Summary${NC}"
echo -e "${YELLOW}====================${NC}"

if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
  exit 0
else
  echo -e "${RED}$FAILURES test suites failed.${NC}"
  echo -e "${RED}Check the log files in test_results/ for details.${NC}"
  exit 1
fi 