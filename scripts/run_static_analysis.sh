#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running Static Analysis Tools${NC}"
echo -e "${YELLOW}============================${NC}"

# Create directory for reports
mkdir -p security_reports

# Run Slither
echo -e "\n${YELLOW}Running Slither...${NC}"

if command -v slither &> /dev/null; then
    # Run Slither with JSON output
    slither . --json security_reports/slither-output.json
    
    # Create human-readable report
    slither . --print human-summary > security_reports/slither-summary.txt
    
    # Generate checklist in markdown format
    slither . --print contract-summary --markdown-root . > security_reports/slither-contract-summary.md
    
    echo -e "${GREEN}Slither analysis complete! Reports saved to security_reports/ directory${NC}"
else
    echo -e "${RED}Slither not found. Installing...${NC}"
    pip3 install slither-analyzer
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Slither installed successfully. Running analysis...${NC}"
        slither . --json security_reports/slither-output.json
        slither . --print human-summary > security_reports/slither-summary.txt
        echo -e "${GREEN}Slither analysis complete! Reports saved to security_reports/ directory${NC}"
    else
        echo -e "${RED}Failed to install Slither. Please install manually with: pip3 install slither-analyzer${NC}"
    fi
fi

# Run MythX (if configured)
echo -e "\n${YELLOW}Checking for MythX...${NC}"

if command -v mythx &> /dev/null; then
    echo -e "\n${YELLOW}Running MythX Analysis...${NC}"
    echo -e "${YELLOW}Note: This may take some time for deep analysis${NC}"
    
    # Check if logged in
    mythx --version > /dev/null
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}Please login to MythX first with: mythx login${NC}"
        echo -e "${YELLOW}Skipping MythX analysis${NC}"
    else
        # Run MythX with standard mode (quicker than deep)
        mythx analyze --mode standard --format json --output security_reports/mythx-report.json
        mythx analyze --mode standard --format html --output security_reports/mythx-report.html
        
        echo -e "${GREEN}MythX analysis complete! Reports saved to security_reports/ directory${NC}"
    fi
else
    echo -e "${RED}MythX CLI not found. Please install with: pip install mythx-cli${NC}"
    echo -e "${YELLOW}To run MythX analysis later, install the CLI and run this script again.${NC}"
fi

# Run solhint if available
echo -e "\n${YELLOW}Checking for solhint...${NC}"
if command -v solhint &> /dev/null; then
    echo -e "${YELLOW}Running solhint analysis...${NC}"
    solhint 'contracts/**/*.sol' > security_reports/solhint-report.txt
    echo -e "${GREEN}Solhint analysis complete! Report saved to security_reports/solhint-report.txt${NC}"
else
    echo -e "${YELLOW}Solhint not found. Installing...${NC}"
    npm install -g solhint
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Solhint installed successfully. Running analysis...${NC}"
        solhint 'contracts/**/*.sol' > security_reports/solhint-report.txt
        echo -e "${GREEN}Solhint analysis complete! Report saved to security_reports/solhint-report.txt${NC}"
    else
        echo -e "${RED}Failed to install Solhint. Please install manually with: npm install -g solhint${NC}"
    fi
fi

echo -e "\n${GREEN}Static analysis complete!${NC}"
echo -e "${YELLOW}Reports are available in the security_reports/ directory${NC}"

# Summary of findings (if slither was run)
if [ -f "security_reports/slither-summary.txt" ]; then
    echo -e "\n${YELLOW}Summary of Slither findings:${NC}"
    cat security_reports/slither-summary.txt
fi 