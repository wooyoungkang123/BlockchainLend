// Helper functions for deployment configuration
const fs = require('fs');
const path = require('path');

/**
 * Get the deployment configuration from the deployments directory
 * @param {string} networkName - The name of the network
 * @returns {Object} The deployment configuration
 */
function getDeploymentConfig(networkName) {
  const deploymentPath = path.resolve(__dirname, '../../deployments/deployments.json');
  
  if (!fs.existsSync(deploymentPath)) {
    return { networks: { [networkName]: {} } };
  }
  
  try {
    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    // Ensure networks object exists
    if (!deploymentData.networks) {
      deploymentData.networks = {};
    }
    // Ensure network entry exists
    if (networkName && !deploymentData.networks[networkName]) {
      deploymentData.networks[networkName] = {};
    }
    return deploymentData;
  } catch (error) {
    console.error('Error reading deployment config:', error);
    return { networks: { [networkName]: {} } };
  }
}

/**
 * Save the deployment configuration to the deployments directory
 * @param {Object} deploymentData - The deployment configuration to save
 */
function saveDeploymentConfig(deploymentData) {
  const deploymentPath = path.resolve(__dirname, '../../deployments/deployments.json');
  
  try {
    fs.writeFileSync(
      deploymentPath, 
      JSON.stringify(deploymentData, null, 2)
    );
    console.log('Deployment config saved successfully');
  } catch (error) {
    console.error('Error saving deployment config:', error);
  }
}

/**
 * Update contract address in deployment configuration
 * @param {string} networkName - The name of the network
 * @param {string} contractName - The name of the contract
 * @param {string} contractAddress - The contract address
 */
function updateContractAddress(networkName, contractName, contractAddress) {
  const deploymentData = getDeploymentConfig(networkName);
  
  if (!deploymentData.networks[networkName]) {
    deploymentData.networks[networkName] = {};
  }
  
  deploymentData.networks[networkName][contractName] = contractAddress;
  saveDeploymentConfig(deploymentData);
}

module.exports = {
  getDeploymentConfig,
  saveDeploymentConfig,
  updateContractAddress
}; 