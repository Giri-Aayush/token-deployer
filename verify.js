const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// CLI Colors and styling
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function logSuccess(message) {
    console.log(colorize(`✅ ${message}`, 'green'));
}

function logError(message) {
    console.log(colorize(`❌ ${message}`, 'red'));
}

function logWarning(message) {
    console.log(colorize(`⚠️  ${message}`, 'yellow'));
}

function logInfo(message) {
    console.log(colorize(`ℹ️  ${message}`, 'blue'));
}

function logHeader(message) {
    console.log('\n' + colorize('═'.repeat(60), 'cyan'));
    console.log(colorize(`${message}`, 'cyan'));
    console.log(colorize('═'.repeat(60), 'cyan'));
}

function logSubHeader(message) {
    console.log('\n' + colorize(`📋 ${message}`, 'magenta'));
    console.log(colorize('─'.repeat(40), 'dim'));
}

function displayBanner() {
    console.clear();
    console.log(colorize(`
    ██╗   ██╗███████╗██████╗ ██╗███████╗██╗███████╗██████╗ 
    ██║   ██║██╔════╝██╔══██╗██║██╔════╝██║██╔════╝██╔══██╗
    ██║   ██║█████╗  ██████╔╝██║█████╗  ██║█████╗  ██████╔╝
    ╚██╗ ██╔╝██╔══╝  ██╔══██╗██║██╔══╝  ██║██╔══╝  ██╔══██╗
     ╚████╔╝ ███████╗██║  ██║██║██║     ██║███████╗██║  ██║
      ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝
    `, 'cyan'));
    
    console.log(colorize('    🔍 Smart Contract Verification Tool v2.0', 'bright'));
    console.log(colorize('    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim'));
}

function getNetworkConfig() {
    const NETWORK = process.env.NETWORK?.toLowerCase();
    const apiKey = process.env.ETHERSCAN_API_KEY;
    
    let apiUrl, explorerUrl, networkName;
    
    if (NETWORK === 'mainnet') {
        apiUrl = 'https://api.etherscan.io/api';
        explorerUrl = 'https://etherscan.io';
        networkName = 'Ethereum Mainnet';
    } else {
        apiUrl = 'https://api-sepolia.etherscan.io/api';
        explorerUrl = 'https://sepolia.etherscan.io';
        networkName = 'Sepolia Testnet';
    }
    
    return { apiUrl, explorerUrl, networkName, apiKey };
}

async function verifyContract(tokenSymbol = null) {
    try {
        displayBanner();
        
        const { apiUrl, explorerUrl, networkName, apiKey } = getNetworkConfig();
        
        if (!apiKey) {
            logError('Missing ETHERSCAN_API_KEY in .env file');
            console.log(colorize('   Get your API key from: https://etherscan.io/apis', 'blue'));
            return;
        }
        
        logSubHeader('NETWORK CONFIGURATION');
        logInfo(`Network: ${networkName}`);
        logInfo(`API Endpoint: ${apiUrl}`);
        
        let deploymentPath;
        let contractPath;
        
        if (tokenSymbol) {
            // Verify specific token from its folder
            deploymentPath = path.join('contracts', tokenSymbol, 'deployment.json');
            contractPath = path.join('contracts', tokenSymbol, 'token.sol');
            
            logSubHeader('TARGET CONTRACT');
            logInfo(`Verifying specific token: ${tokenSymbol}`);
            
            if (!fs.existsSync(deploymentPath)) {
                logError(`${deploymentPath} not found`);
                logWarning('Available tokens:');
                listAvailableTokens();
                return;
            }
            
            if (!fs.existsSync(contractPath)) {
                logError(`${contractPath} not found`);
                return;
            }
        } else {
            // Verify current deployment from root
            deploymentPath = 'deployment.json';
            
            if (!fs.existsSync(deploymentPath)) {
                logError('deployment.json not found in root directory');
                console.log(colorize('\n📖 Usage Options:', 'yellow'));
                console.log(colorize('   1. Deploy a new token first: node deploy.js', 'white'));
                console.log(colorize('   2. Verify a specific token: node verify.js TOKEN_SYMBOL', 'white'));
                console.log(colorize('\n📁 Available tokens:', 'yellow'));
                listAvailableTokens();
                return;
            }
            
            // For root deployment, contract file is in contracts/SYMBOL.sol
            const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
            contractPath = path.join('contracts', `${deployment.symbol}.sol`);
            
            if (!fs.existsSync(contractPath)) {
                logError(`${contractPath} not found`);
                return;
            }
            
            logSubHeader('TARGET CONTRACT');
            logInfo('Verifying current deployment from root directory');
        }
        
        // Load deployment data
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        
        console.log(colorize(`   📄 Contract: ${deployment.name} (${deployment.symbol})`, 'white'));
        console.log(colorize(`   📍 Address: ${deployment.address}`, 'white'));
        console.log(colorize(`   📂 Deployment: ${deploymentPath}`, 'white'));
        console.log(colorize(`   📜 Source: ${contractPath}`, 'white'));
        
        // Read contract source code
        const sourceCode = fs.readFileSync(contractPath, 'utf8');
        
        // Prepare verification parameters
        const params = new URLSearchParams();
        params.append('apikey', apiKey);
        params.append('module', 'contract');
        params.append('action', 'verifysourcecode');
        params.append('contractaddress', deployment.address);
        params.append('sourceCode', sourceCode);
        params.append('codeformat', 'solidity-single-file');
        params.append('contractname', deployment.symbol);
        params.append('compilerversion', 'v0.8.24+commit.e11b9ed9');
        params.append('optimizationUsed', '1');
        params.append('runs', '200');
        params.append('constructorArguements', '');
        params.append('evmversion', 'shanghai');
        params.append('licenseType', '1');
        
        logSubHeader('VERIFICATION PARAMETERS');
        console.log(colorize(`   🔧 Compiler: v0.8.24+commit.e11b9ed9`, 'white'));
        console.log(colorize(`   ⚡ EVM Version: shanghai`, 'white'));
        console.log(colorize(`   🚀 Optimization: 200 runs`, 'white'));
        console.log(colorize(`   📋 License: Unlicense`, 'white'));
        
        logSubHeader('SUBMITTING VERIFICATION');
        logInfo('Sending verification request...');
        
        const submitResponse = await axios.post(
            apiUrl,
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 30000
            }
        );
        
        console.log('\n' + colorize('📤 Server Response:', 'blue'));
        console.log(colorize(`   Status: ${submitResponse.data.status}`, 'white'));
        console.log(colorize(`   Result: ${submitResponse.data.result}`, 'white'));
        
        if (submitResponse.data.status === '1') {
            const guid = submitResponse.data.result;
            logSuccess(`Verification submitted! GUID: ${guid}`);
            
            // Check verification status
            logSubHeader('CHECKING VERIFICATION STATUS');
            await checkVerificationStatus(guid, apiKey, deployment.address, apiUrl, explorerUrl);
            
        } else if (submitResponse.data.result === 'Contract source code already verified') {
            logHeader('🎉 CONTRACT ALREADY VERIFIED!');
            displayContractLinks(deployment.address, explorerUrl);
        } else {
            logError(`Verification submission failed: ${submitResponse.data.result}`);
            if (submitResponse.data.message) {
                console.log(colorize(`   Details: ${submitResponse.data.message}`, 'red'));
            }
        }
        
    } catch (error) {
        logError('Verification failed');
        if (error.response) {
            console.log(colorize(`   API Error: ${JSON.stringify(error.response.data, null, 2)}`, 'red'));
        } else {
            console.log(colorize(`   Error: ${error.message}`, 'red'));
        }
    }
}

async function checkVerificationStatus(guid, apiKey, contractAddress, apiUrl, explorerUrl) {
    const maxAttempts = 15;
    let attempts = 0;
    
    logInfo('Monitoring verification progress...');
    
    while (attempts < maxAttempts) {
        try {
            await sleep(8000); // Wait 8 seconds
            
            const statusResponse = await axios.get(apiUrl, {
                params: {
                    apikey: apiKey,
                    module: 'contract',
                    action: 'checkverifystatus',
                    guid: guid
                }
            });
            
            const status = statusResponse.data.result;
            attempts++;
            
            const progress = `[${attempts}/${maxAttempts}]`;
            console.log(colorize(`   ${progress} ${status}`, 'dim'));
            
            if (status === 'Pass - Verified') {
                logHeader('🎉 VERIFICATION SUCCESSFUL!');
                displayContractLinks(contractAddress, explorerUrl);
                break;
            } else if (status === 'Already Verified') {
                logHeader('✅ CONTRACT ALREADY VERIFIED!');
                displayContractLinks(contractAddress, explorerUrl);
                break;
            } else if (status.includes('Fail')) {
                logError(`Verification failed: ${status}`);
                console.log(colorize('\n💡 Common fixes:', 'yellow'));
                console.log(colorize('   • Check compiler version matches deployment', 'white'));
                console.log(colorize('   • Verify optimization settings (200 runs)', 'white'));
                console.log(colorize('   • Ensure contract name matches file', 'white'));
                console.log(colorize('   • Confirm EVM version (shanghai)', 'white'));
                break;
            } else if (attempts >= maxAttempts) {
                logWarning('Verification timeout - check manually');
                console.log(colorize(`   📋 Check status: ${explorerUrl}/address/${contractAddress}#code`, 'blue'));
                break;
            }
            
        } catch (error) {
            logError(`Status check failed: ${error.message}`);
            break;
        }
    }
}

function displayContractLinks(contractAddress, explorerUrl) {
    console.log(colorize(`   📋 Contract: ${explorerUrl}/address/${contractAddress}`, 'green'));
    console.log(colorize(`   📄 Source Code: ${explorerUrl}/address/${contractAddress}#code`, 'green'));
    console.log(colorize(`   📊 Read Contract: ${explorerUrl}/address/${contractAddress}#readContract`, 'green'));
    console.log(colorize(`   ✍️  Write Contract: ${explorerUrl}/address/${contractAddress}#writeContract`, 'green'));
    
    console.log('\n' + colorize('🎊 Contract is now publicly verifiable! 🎊', 'bright'));
}

function listAvailableTokens() {
    const contractsDir = 'contracts';
    
    if (!fs.existsSync(contractsDir)) {
        console.log(colorize('   📁 No contracts directory found', 'dim'));
        return;
    }
    
    const tokenDirs = fs.readdirSync(contractsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    
    if (tokenDirs.length === 0) {
        console.log(colorize('   📁 No tokens found', 'dim'));
        return;
    }
    
    tokenDirs.forEach(tokenSymbol => {
        const deploymentPath = path.join(contractsDir, tokenSymbol, 'deployment.json');
        if (fs.existsSync(deploymentPath)) {
            try {
                const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
                console.log(colorize(`   📄 ${tokenSymbol}: ${deployment.address} (${deployment.name})`, 'white'));
            } catch (e) {
                console.log(colorize(`   ⚠️  ${tokenSymbol}: Invalid deployment.json`, 'yellow'));
            }
        }
    });
    
    // Also check for root deployment
    if (fs.existsSync('deployment.json')) {
        try {
            const deployment = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
            console.log(colorize(`   📄 [ROOT]: ${deployment.address} (${deployment.name})`, 'cyan'));
        } catch (e) {
            console.log(colorize('   ⚠️  [ROOT]: Invalid deployment.json', 'yellow'));
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main execution
if (require.main === module) {
    const tokenSymbol = process.argv[2];
    
    if (tokenSymbol) {
        console.log(colorize(`🎯 Verification requested for: ${tokenSymbol}`, 'bright'));
    } else {
        console.log(colorize('🎯 Verifying current deployment (from root)', 'bright'));
    }
    
    verifyContract(tokenSymbol);
}

module.exports = { verifyContract };