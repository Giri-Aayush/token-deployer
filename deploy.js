const { ethers } = require('ethers');
const readline = require('readline');
const fs = require('fs');
const solc = require('solc');
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

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(colorize(`${question}`, 'bright'), (answer) => {
            resolve(answer.trim());
        });
    });
}

function displayBanner() {
    console.clear();
    console.log(colorize(`
    ████████╗ ██████╗ ██╗  ██╗███████╗███╗   ██╗
    ╚══██╔══╝██╔═══██╗██║ ██╔╝██╔════╝████╗  ██║
       ██║   ██║   ██║█████╔╝ █████╗  ██╔██╗ ██║
       ██║   ██║   ██║██╔═██╗ ██╔══╝  ██║╚██╗██║
       ██║   ╚██████╔╝██║  ██╗███████╗██║ ╚████║
       ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝
                                                   
    ██████╗ ███████╗██████╗ ██╗      ██████╗ ██╗   ██╗███████╗██████╗ 
    ██╔══██╗██╔════╝██╔══██╗██║     ██╔═══██╗╚██╗ ██╔╝██╔════╝██╔══██╗
    ██║  ██║█████╗  ██████╔╝██║     ██║   ██║ ╚████╔╝ █████╗  ██████╔╝
    ██║  ██║██╔══╝  ██╔═══╝ ██║     ██║   ██║  ╚██╔╝  ██╔══╝  ██╔══██╗
    ██████╔╝███████╗██║     ███████╗╚██████╔╝   ██║   ███████╗██║  ██║
    ╚═════╝ ╚══════╝╚═╝     ╚══════╝ ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═╝
    `, 'cyan'));
    
    console.log(colorize('    🚀 Professional Token Deployment Tool v2.0', 'bright'));
    console.log(colorize('    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim'));
}

function getNetworkConfig() {
    const NETWORK = process.env.NETWORK?.toLowerCase();
    const privateKey = process.env.MAIN_PRIVATE_KEY;
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
    
    let rpcUrl, explorerUrl, networkName, chainId;
    
    if (NETWORK === 'mainnet') {
        rpcUrl = process.env.MAINNET_RPC_URL;
        explorerUrl = 'https://etherscan.io';
        networkName = 'Ethereum Mainnet';
        chainId = 1;
    } else {
        rpcUrl = process.env.TESTNET_RPC_URL;
        explorerUrl = 'https://sepolia.etherscan.io';
        networkName = 'Sepolia Testnet';
        chainId = 11155111; // Sepolia chain ID
    }
    
    return { rpcUrl, explorerUrl, networkName, chainId, privateKey, etherscanApiKey };
}

async function getETHPrice(chainId, apiKey) {
    try {
        if (!apiKey) {
            logWarning('No Etherscan API key found, using estimated price');
            return { price: 2300, source: 'estimated (no API key)' };
        }
        
        logInfo('Fetching current ETH price...');
        
        const axios = require('axios');
        
        // Always use mainnet API for price data
        const apiUrl = 'https://api.etherscan.io/v2/api';
        const priceChainId = 1; // Always use mainnet for price
        
        console.log(colorize(`   🔍 API URL: ${apiUrl}`, 'dim'));
        console.log(colorize(`   🔑 Using API key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'Not provided'}`, 'dim'));
        
        const response = await axios.get(apiUrl, {
            params: {
                chainid: priceChainId,
                module: 'stats',
                action: 'ethprice',
                apikey: apiKey
            },
            timeout: 10000 // Increased timeout
        });
        
        console.log(colorize(`   📡 API Response Status: ${response.status}`, 'dim'));
        console.log(colorize(`   📋 API Response Data: ${JSON.stringify(response.data)}`, 'dim'));
        
        if (response.data && response.data.status === '1' && response.data.result) {
            const result = response.data.result;
            const price = parseFloat(result.ethusd);
            
            if (isNaN(price) || price <= 0) {
                throw new Error(`Invalid price value: ${result.ethusd}`);
            }
            
            const timestamp = new Date(parseInt(result.ethusd_timestamp) * 1000);
            
            logSuccess(`Current ETH price: $${price.toFixed(2)} (updated: ${timestamp.toLocaleTimeString()})`);
            
            return { 
                price, 
                source: 'Etherscan API',
                timestamp: result.ethusd_timestamp,
                ethbtc: result.ethbtc
            };
        } else {
            throw new Error(`API Error - Status: ${response.data?.status}, Message: ${response.data?.message || 'Unknown error'}`);
        }
        
    } catch (error) {
        logError(`Failed to fetch ETH price: ${error.message}`);
        
        if (error.response) {
            console.log(colorize(`   HTTP Status: ${error.response.status}`, 'red'));
            console.log(colorize(`   Response Data: ${JSON.stringify(error.response.data)}`, 'red'));
        }
        
        logWarning('Using estimated price of $2300');
        return { 
            price: 2300, 
            source: 'estimated (API failed)',
            timestamp: Math.floor(Date.now() / 1000).toString(),
            ethbtc: 'N/A',
            error: error.message
        };
    }
}

function compileContract(sourceCode, contractName) {
    logSubHeader('COMPILING CONTRACT');
    
    const input = {
        language: 'Solidity',
        sources: {
            'Token.sol': {
                content: sourceCode
            }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            },
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    };
    
    try {
        const output = JSON.parse(solc.compile(JSON.stringify(input)));
        
        if (output.errors) {
            const hasErrors = output.errors.some(error => error.severity === 'error');
            if (hasErrors) {
                logError('Compilation errors detected:');
                output.errors.forEach(error => {
                    if (error.severity === 'error') {
                        console.log(colorize(`   • ${error.message}`, 'red'));
                    }
                });
                throw new Error('Compilation failed');
            }
        }
        
        const contract = output.contracts['Token.sol'][contractName];
        const bytecode = '0x' + contract.evm.bytecode.object;
        const abi = contract.abi;
        
        logSuccess('Contract compiled successfully!');
        logInfo(`Bytecode size: ${(bytecode.length / 2).toLocaleString()} bytes`);
        
        return { bytecode, abi };
        
    } catch (error) {
        logError(`Compilation failed: ${error.message}`);
        throw error;
    }
}

async function main() {
    try {
        displayBanner();
        
        // Load environment and network config
        const { rpcUrl, explorerUrl, networkName, chainId, privateKey, etherscanApiKey } = getNetworkConfig();
        
        if (!privateKey || !rpcUrl) {
            logError('Missing required environment variables:');
            console.log(colorize('   • MAIN_PRIVATE_KEY', 'red'));
            console.log(colorize('   • MAINNET_RPC_URL or TESTNET_RPC_URL', 'red'));
            console.log(colorize('   • NETWORK (mainnet/testnet)', 'red'));
            process.exit(1);
        }
        
        logSubHeader('NETWORK CONFIGURATION');
        logInfo(`Network: ${networkName}`);
        
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        
        logInfo(`Deployer: ${wallet.address}`);
        
        const balance = await provider.getBalance(wallet.address);
        const balanceEth = ethers.formatEther(balance);
        logInfo(`Balance: ${balanceEth} ETH`);
        
        if (parseFloat(balanceEth) < 0.01) {
            logWarning('Low balance detected! Make sure you have enough ETH for deployment.');
        }
        
        // Collect token information
        logSubHeader('TOKEN INFORMATION');
        
        const name = await askQuestion('🏷️  Token Name: ');
        const symbol = await askQuestion('🔤 Token Symbol: ');
        const symbolUpper = symbol.toUpperCase();
        const website = await askQuestion('🌐 Website (optional): ');
        const telegram = await askQuestion('📱 Telegram (optional): ');
        const twitter = await askQuestion('🐦 Twitter (optional): ');
        
        // Display summary
        logSubHeader('DEPLOYMENT SUMMARY');
        console.log(colorize(`   Name:      ${name}`, 'white'));
        console.log(colorize(`   Symbol:    ${symbolUpper}`, 'white'));
        console.log(colorize(`   Website:   ${website || 'Not provided'}`, 'white'));
        console.log(colorize(`   Telegram:  ${telegram || 'Not provided'}`, 'white'));
        console.log(colorize(`   Twitter:   ${twitter || 'Not provided'}`, 'white'));
        console.log(colorize(`   Network:   ${networkName}`, 'white'));
        
        console.log('\n' + colorize('⚠️  WARNING: This action will deploy a smart contract and cannot be undone!', 'bgYellow'));
        
        const confirm = await askQuestion('\n🚀 Deploy contract? (y/N): ');
        if (confirm.toLowerCase() !== 'y') {
            logWarning('Deployment cancelled by user');
            rl.close();
            return;
        }
        
        // Create contract file
        const contractCode = generateContract(name, symbolUpper, website, telegram, twitter);
        
        if (!fs.existsSync('contracts')) {
            fs.mkdirSync('contracts');
        }
        
        fs.writeFileSync(`contracts/${symbolUpper}.sol`, contractCode);
        logSuccess(`Contract saved: contracts/${symbolUpper}.sol`);
        
        // Compile contract
        const { bytecode, abi } = compileContract(contractCode, symbolUpper);
        
        // Deploy contract
        logSubHeader('DEPLOYMENT PROCESS');
        
        logInfo('Creating contract factory...');
        const factory = new ethers.ContractFactory(abi, bytecode, wallet);
        
        logInfo('Sending deployment transaction...');
        
        // Get balance before deployment for gas calculation
        const balanceBeforeDeployment = await provider.getBalance(wallet.address);
        
        const contract = await factory.deploy({
            gasLimit: 3500000,
            gasPrice: ethers.parseUnits('20', 'gwei')
        });
        
        const txHash = contract.deploymentTransaction().hash;
        logInfo(`Transaction hash: ${txHash}`);
        logInfo('Waiting for confirmation...');
        
        await contract.waitForDeployment();
        const address = await contract.getAddress();
        
        // Get transaction receipt for gas information
        const receipt = await provider.getTransactionReceipt(txHash);
        const balanceAfterDeployment = await provider.getBalance(wallet.address);
        
        // Calculate gas costs
        const gasUsed = receipt.gasUsed;
        const gasPrice = receipt.gasPrice || ethers.parseUnits('20', 'gwei');
        const gasFee = gasUsed * gasPrice;
        const totalCost = balanceBeforeDeployment - balanceAfterDeployment;
        
        // Get current ETH price
        const ethPriceData = await getETHPrice(chainId, etherscanApiKey);
        const ethCostInUSD = parseFloat(ethers.formatEther(totalCost)) * ethPriceData.price;
        
        // Success message
        logHeader('🎉 DEPLOYMENT SUCCESSFUL!');
        console.log(colorize(`   Contract Address: ${address}`, 'green'));
        console.log(colorize(`   Explorer: ${explorerUrl}/address/${address}`, 'blue'));
        console.log(colorize(`   Transaction: ${explorerUrl}/tx/${txHash}`, 'blue'));
        
        // Gas usage information
        logSubHeader('⛽ GAS USAGE DETAILS');
        console.log(colorize(`   💨 Gas Used: ${gasUsed.toLocaleString()} units`, 'white'));
        console.log(colorize(`   💰 Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`, 'white'));
        console.log(colorize(`   💳 Gas Fee: ${ethers.formatEther(gasFee)} ETH`, 'white'));
        console.log(colorize(`   📊 Total Cost: ${ethers.formatEther(totalCost)} ETH`, 'white'));
        console.log(colorize(`   💵 USD Cost: ~$${ethCostInUSD.toFixed(2)} (at $${ethPriceData.price.toFixed(2)}/ETH)`, 'white'));
        console.log(colorize(`   📈 Price Source: ${ethPriceData.source}`, 'dim'));
        if (ethPriceData.timestamp && ethPriceData.ethbtc && ethPriceData.ethbtc !== 'N/A') {
            const updateTime = new Date(parseInt(ethPriceData.timestamp) * 1000);
            console.log(colorize(`   🕐 Last Updated: ${updateTime.toLocaleString()}`, 'dim'));
            console.log(colorize(`   ₿ ETH/BTC: ${ethPriceData.ethbtc}`, 'dim'));
        }
        
        // Verify deployment
        logSubHeader('VERIFICATION');
        try {
            const deployedName = await contract.name();
            const deployedSymbol = await contract.symbol();
            const totalSupply = await contract.totalSupply();
            const ownerBalance = await contract.balanceOf(wallet.address);
            
            console.log(colorize(`   ✅ Name: ${deployedName}`, 'green'));
            console.log(colorize(`   ✅ Symbol: ${deployedSymbol}`, 'green'));
            console.log(colorize(`   ✅ Total Supply: ${ethers.formatUnits(totalSupply, 9)}`, 'green'));
            console.log(colorize(`   ✅ Owner Balance: ${ethers.formatUnits(ownerBalance, 9)}`, 'green'));
        } catch (e) {
            logError(`Verification failed: ${e.message}`);
        }
        
        // Save deployment results
        const results = {
            name,
            symbol: symbolUpper,
            website,
            telegram,
            twitter,
            address,
            txHash,
            deployer: wallet.address,
            network: networkName,
            timestamp: new Date().toISOString(),
            gasUsage: {
                gasUsed: gasUsed.toString(),
                gasPrice: gasPrice.toString(),
                gasFee: gasFee.toString(),
                totalCost: totalCost.toString(),
                gasUsedFormatted: gasUsed.toLocaleString(),
                gasPriceFormatted: `${ethers.formatUnits(gasPrice, 'gwei')} gwei`,
                gasFeeFormatted: `${ethers.formatEther(gasFee)} ETH`,
                totalCostFormatted: `${ethers.formatEther(totalCost)} ETH`,
                ethPrice: ethPriceData.price,
                ethPriceSource: ethPriceData.source,
                ethPriceTimestamp: ethPriceData.timestamp,
                ethBtcRatio: ethPriceData.ethbtc,
                usdCost: ethCostInUSD,
                usdCostFormatted: `$${ethCostInUSD.toFixed(2)}`
            },
            bytecode,
            abi
        };
        
        fs.writeFileSync('deployment.json', JSON.stringify(results, null, 2));
        logSuccess('Deployment data saved: deployment.json');
        
        // Next steps
        logSubHeader('📋 NEXT STEPS');
        console.log(colorize('   1. ✓ Verify Token on network', 'cyan'));
        console.log(colorize('   2. 💰 Send ETH to contract for liquidity', 'cyan'));
        console.log(colorize('   3. 🟢 Call openTrading() function', 'cyan'));
        console.log(colorize('   4. 🔥 Burn LP tokens', 'cyan'));
        console.log(colorize('   5. 🚫 Remove trading limits', 'cyan'));
        console.log(colorize('   6. 🔐 Renounce ownership', 'cyan'));
        
        console.log('\n' + colorize('🎊 Thank you for using Token Deployer! 🎊', 'bright'));
        
        rl.close();
        
    } catch (error) {
        logError(`Deployment failed: ${error.message}`);
        rl.close();
        process.exit(1);
    }
}

function generateContract(name, symbol, website, telegram, twitter) {
    let header = '// SPDX-License-Identifier: UNLICENSE\n\n/*\n\n';
    header += `${name} (${symbol})\n\n`;
    if (website) header += `Website: ${website}\n`;
    if (telegram) header += `Telegram: ${telegram}\n`;
    if (twitter) header += `Twitter: ${twitter}\n`;
    header += '\n*/\n\n';
    
    return `${header}pragma solidity ^0.8.24;

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
}

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;
        return c;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }
        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");
        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        uint256 c = a / b;
        return c;
    }
}

contract Ownable is Context {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor () {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    function owner() public view returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(_owner == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }
}

interface IUniswapV2Factory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

interface IUniswapV2Router02 {
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
    function factory() external pure returns (address);
    function WETH() external pure returns (address);
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
}

contract ${symbol} is Context, IERC20, Ownable {
    using SafeMath for uint256;
    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowances;
    mapping (address => bool) private _isExcludedFromFee;
    address payable private _taxWallet;

    uint256 private _initialBuyTax = 6;
    uint256 private _initialSellTax = 6;
    uint256 private _finalBuyTax = 0;
    uint256 private _finalSellTax = 0;
    uint256 private _reduceBuyTaxAt = 1;
    uint256 private _reduceSellTaxAt = 1;
    uint256 private _preventSwapBefore = 1;
    uint256 private _transferTax = 0;
    uint256 private _buyCount = 0;

    uint8 private constant _decimals = 9;
    uint256 private constant _tTotal = 1000000000 * 10**_decimals;
    string private constant _name = unicode"${name}";
    string private constant _symbol = unicode"${symbol}";
    uint256 public _maxTxAmount = (_tTotal * 1) / 100;
    uint256 public _maxWalletSize = (_tTotal * 1) / 100;
    uint256 public _taxSwapThreshold = (_tTotal * 1) / 100;
    uint256 public _maxTaxSwap = (_tTotal * 1) / 100;
    
    IUniswapV2Router02 private uniswapV2Router;
    address private uniswapV2Pair;
    bool private tradingOpen;
    bool private inSwap = false;
    bool private swapEnabled = false;
    uint256 private sellCount = 0;
    uint256 private lastSellBlock = 0;
    uint256 private firstBlock = 0;
    event MaxTxAmountUpdated(uint _maxTxAmount);
    event TransferTaxUpdated(uint _tax);
    event ClearToken(address TokenAddressCleared, uint256 Amount);
    modifier lockTheSwap {
        inSwap = true;
        _;
        inSwap = false;
    }

    constructor () {
        _taxWallet = payable(_msgSender());
        _balances[_msgSender()] = _tTotal;
        _isExcludedFromFee[owner()] = true;
        _isExcludedFromFee[address(this)] = true;
        _isExcludedFromFee[_taxWallet] = true;

        emit Transfer(address(0), _msgSender(), _tTotal);
    }

    function name() public pure returns (string memory) {
        return _name;
    }

    function symbol() public pure returns (string memory) {
        return _symbol;
    }

    function decimals() public pure returns (uint8) {
        return _decimals;
    }

    function totalSupply() public pure override returns (uint256) {
        return _tTotal;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(sender, _msgSender(), _allowances[sender][_msgSender()].sub(amount, "ERC20: transfer amount exceeds allowance"));
        return true;
    }

    function _approve(address owner, address spender, uint256 amount) private {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _transfer(address from, address to, uint256 amount) private {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(amount > 0, "Transfer amount must be greater than zero");
        uint256 taxAmount = 0;
        if (from != owner() && to != owner()) {

            if(_buyCount == 0){
                taxAmount = amount.mul((_buyCount > _reduceBuyTaxAt) ? _finalBuyTax : _initialBuyTax).div(100);
            }

            if(_buyCount > 0){
                taxAmount =amount.mul(_transferTax).div(100);
            }

            if(block.number == firstBlock){
                require(_buyCount < 87, "Exceeds buys on the first block.");
            }

            if (from == uniswapV2Pair && to != address(uniswapV2Router) && ! _isExcludedFromFee[to] ) {
                if(block.number != firstBlock){
                    require(amount <= _maxTxAmount, "Exceeds the _maxTxAmount.");
                    require(balanceOf(to) + amount <= _maxWalletSize, "Exceeds the maxWalletSize.");
                }

                taxAmount = amount.mul((_buyCount > _reduceBuyTaxAt) ? _finalBuyTax : _initialBuyTax).div(100);
                _buyCount++;
            }

            if(to == uniswapV2Pair && from != address(this) ){
                taxAmount = amount.mul((_buyCount > _reduceSellTaxAt) ? _finalSellTax : _initialSellTax).div(100);
            }

            uint256 contractTokenBalance = balanceOf(address(this));
            if (!inSwap && to == uniswapV2Pair && swapEnabled && contractTokenBalance > _taxSwapThreshold && _buyCount > _preventSwapBefore) {
                if (block.number>lastSellBlock) {
                    sellCount = 0;
                }
                require(sellCount < 3, "Only 3 sells per block!");

                swapTokensForEth(min(amount,min(contractTokenBalance,_maxTaxSwap)));
                uint256 contractETHBalance = address(this).balance;
                if (contractETHBalance>0) {
                    sendETHToFee(address(this).balance);
                }

                sellCount++;
                lastSellBlock =block.number;
            }
        }

        if(taxAmount > 0){
          _balances[address(this)] = _balances[address(this)].add(taxAmount);
          emit Transfer(from, address(this), taxAmount);
        }

        _balances[from]= _balances[from].sub(amount);
        _balances[to]= _balances[to].add(amount.sub(taxAmount));
        emit Transfer(from, to, amount.sub(taxAmount));
    }

    function min(uint256 a, uint256 b) private pure returns (uint256){
      return (a>b) ? b : a;
    }

    function swapTokensForEth(uint256 tokenAmount) private lockTheSwap {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = uniswapV2Router.WETH();
        _approve(address(this), address(uniswapV2Router), tokenAmount);
        uniswapV2Router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            0,
            path,
            address(this),
            block.timestamp
        );
    }

    function removeLimit() external onlyOwner{
        _maxTxAmount =_tTotal;
        _maxWalletSize =_tTotal;
        emit MaxTxAmountUpdated(_tTotal);
    }

    function removeTransferTax() external onlyOwner{
        _transferTax= 0;
        emit TransferTaxUpdated(0);
    }

    function sendETHToFee(uint256 amount) private {
        _taxWallet.transfer(amount);
    }

    function openTrading() external onlyOwner() {
        require(!tradingOpen, "trading is already open");
        uniswapV2Router = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
        _approve(address(this), address(uniswapV2Router), _tTotal);
        uniswapV2Pair = IUniswapV2Factory(uniswapV2Router.factory()).createPair(address(this), uniswapV2Router.WETH());
        uniswapV2Router.addLiquidityETH{value: address(this).balance}(address(this), balanceOf(address(this)), 0, 0, owner(), block.timestamp);
        IERC20(uniswapV2Pair).approve(address(uniswapV2Router), type(uint).max);
        swapEnabled = true;
        tradingOpen = true;
        firstBlock = block.number;
    }

    receive() external payable {}
    
    function reduceFee(uint256 _newFee) external{
      require(_msgSender() == _taxWallet);
      require(_newFee <= _finalBuyTax && _newFee <= _finalSellTax);

      _finalBuyTax =_newFee;
      _finalSellTax =_newFee;
    }

    function clearStuckToken(address tokenAddress, uint256 tokens) external returns (bool success) {
        require(_msgSender() == _taxWallet);

        if(tokens == 0){
            tokens = IERC20(tokenAddress).balanceOf(address(this));
        }

        emit ClearToken(tokenAddress,tokens);
        return IERC20(tokenAddress).transfer(_taxWallet, tokens);
    }

    function manualSend() external {
        require(_msgSender() == _taxWallet);

        uint256 ethBalance= address(this).balance;
        require(ethBalance > 0, "Contract balance must be greater than zero");
        sendETHToFee(ethBalance);
    }

    function manualSwap() external {
        require(_msgSender() == _taxWallet);

        uint256 tokenBalance = balanceOf(address(this));
        if(tokenBalance > 0){
          swapTokensForEth(tokenBalance);
        }

        uint256 ethBalance = address(this).balance;
        if(ethBalance>0){ sendETHToFee(ethBalance); }
    }
}`;
}

if (require.main === module) {
    main();
}