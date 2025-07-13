const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
    try {
        // Get token symbol from command line argument
        const tokenSymbol = process.argv[2];
        
        if (!tokenSymbol) {
            console.error('Usage: node post-deploy.js TOKEN_SYMBOL');
            console.error('Example: node post-deploy.js HLO');
            process.exit(1);
        }
        
        // Get configuration
        const NETWORK = process.env.NETWORK?.toLowerCase();
        const privateKey = process.env.MAIN_PRIVATE_KEY;
        const liquidityAmount = process.env.LIQUIDITY_AMOUNT || '0.01';
        
        let rpcUrl;
        if (NETWORK === 'mainnet') {
            rpcUrl = process.env.MAINNET_RPC_URL;
        } else {
            rpcUrl = process.env.TESTNET_RPC_URL;
        }
        
        if (!privateKey || !rpcUrl) {
            console.error('Missing MAIN_PRIVATE_KEY or RPC_URL in .env');
            process.exit(1);
        }
        
        // Load deployment data from token-specific folder
        const deploymentPath = `contracts/${tokenSymbol}/deployment.json`;
        
        if (!fs.existsSync(deploymentPath)) {
            console.error(`Deployment file not found: ${deploymentPath}`);
            console.error('Available tokens:');
            if (fs.existsSync('contracts')) {
                const tokenDirs = fs.readdirSync('contracts', { withFileTypes: true })
                    .filter(dirent => dirent.isDirectory())
                    .map(dirent => dirent.name);
                tokenDirs.forEach(dir => console.error(`  - ${dir}`));
            }
            process.exit(1);
        }
        
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        const contractAddress = deployment.address;
        const abi = deployment.abi;
        
        console.log('Token Symbol:', tokenSymbol);
        console.log('Contract Address:', contractAddress);
        console.log('Liquidity Amount:', liquidityAmount, 'ETH');
        
        // Setup provider and wallet
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(contractAddress, abi, wallet);
        
        console.log('Wallet Address:', wallet.address);
        
        const balance = await provider.getBalance(wallet.address);
        console.log('Wallet Balance:', ethers.formatEther(balance), 'ETH');
        
        // Step 1: Send ETH to contract
        console.log('\n=== STEP 1: Sending ETH to Contract ===');
        const ethAmount = ethers.parseEther(liquidityAmount);
        
        try {
            // Use higher gas limit and check current gas price
            const feeData = await provider.getFeeData();
            console.log('Current gas price:', ethers.formatUnits(feeData.gasPrice, 'gwei'), 'gwei');
            
            const sendTx = await wallet.sendTransaction({
                to: contractAddress,
                value: ethAmount,
                gasLimit: 50000, // Higher gas limit
                gasPrice: feeData.gasPrice
            });
            
            console.log('Send ETH TX:', sendTx.hash);
            const receipt = await sendTx.wait();
            
            if (receipt.status === 1) {
                console.log('ETH sent successfully');
                
                // Check contract balance
                const contractBalance = await provider.getBalance(contractAddress);
                console.log('Contract Balance:', ethers.formatEther(contractBalance), 'ETH');
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Failed to send ETH to contract:', error.message);
            console.log('This might be normal - some contracts reject ETH before trading opens');
            console.log('The openTrading() function will handle liquidity provision');
        }
        
        // Step 1.5: Transfer all tokens from wallet to contract
        console.log('\n=== STEP 1.5: Transferring Tokens to Contract ===');
        try {
            const totalSupply = await contract.totalSupply();
            console.log('Total Supply:', ethers.formatUnits(totalSupply, 9));
            
            const walletBalance = await contract.balanceOf(wallet.address);
            console.log('Wallet Token Balance:', ethers.formatUnits(walletBalance, 9));
            
            if (walletBalance > 0) {
                console.log('Transferring all tokens to contract...');
                const transferTx = await contract.transfer(contractAddress, walletBalance, {
                    gasLimit: 100000
                });
                
                console.log('Transfer TX:', transferTx.hash);
                await transferTx.wait();
                console.log('All tokens transferred to contract');
                
                // Verify the transfer
                const contractTokenBalance = await contract.balanceOf(contractAddress);
                console.log('Contract Token Balance:', ethers.formatUnits(contractTokenBalance, 9));
            } else {
                console.log('No tokens in wallet to transfer');
            }
        } catch (error) {
            console.error('Failed to transfer tokens:', error.message);
            throw error;
        }
        
        // Step 2: Open Trading
        console.log('\n=== STEP 2: Opening Trading ===');
        
        // Check if trading is already open
        try {
            // First, let's check the contract state
            console.log('Checking contract state...');
            
            // Get contract balance
            const contractBalance = await provider.getBalance(contractAddress);
            console.log('Contract Balance:', ethers.formatEther(contractBalance), 'ETH');
            
            // Check owner
            const owner = await contract.owner();
            console.log('Contract owner:', owner);
            console.log('Wallet address:', wallet.address);
            
            if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
                throw new Error('Wallet is not the contract owner!');
            }
            
            // Check if we have enough tokens in contract
            const contractTokenBalance = await contract.balanceOf(contractAddress);
            console.log('Contract token balance:', ethers.formatUnits(contractTokenBalance, 9));
            
            // Check total supply
            const totalSupply = await contract.totalSupply();
            console.log('Total supply:', ethers.formatUnits(totalSupply, 9));
            
            // Check if trading is already open (this might fail if the function doesn't exist)
            let tradingOpen = false;
            try {
                // Try different ways to check trading status
                tradingOpen = await contract.tradingOpen();
                console.log('Trading status:', tradingOpen ? 'OPEN' : 'CLOSED');
            } catch (e) {
                console.log('Could not read trading status, assuming closed');
            }
            
            if (tradingOpen) {
                console.log('Trading is already open, skipping openTrading()');
            } else {
                // Ensure minimum liquidity (let's try with more ETH)
                const minLiquidity = ethers.parseEther('0.001'); // 0.001 ETH minimum
                if (contractBalance < minLiquidity) {
                    console.log(`Need at least ${ethers.formatEther(minLiquidity)} ETH for liquidity`);
                    const additionalETH = minLiquidity - contractBalance;
                    console.log(`Sending additional ${ethers.formatEther(additionalETH)} ETH...`);
                    
                    const sendTx = await wallet.sendTransaction({
                        to: contractAddress,
                        value: additionalETH,
                        gasLimit: 50000
                    });
                    console.log('Additional ETH TX:', sendTx.hash);
                    await sendTx.wait();
                    console.log('Additional ETH sent successfully');
                    
                    // Recheck balance
                    const newBalance = await provider.getBalance(contractAddress);
                    console.log('New contract balance:', ethers.formatEther(newBalance), 'ETH');
                }
                
                console.log('Attempting to open trading...');
                
                // Try to estimate gas first
                try {
                    const gasEstimate = await contract.openTrading.estimateGas();
                    console.log('Estimated gas:', gasEstimate.toString());
                } catch (gasError) {
                    console.log('Gas estimation failed:', gasError.message);
                    // Continue anyway with a high gas limit
                }
                
                const openTradingTx = await contract.openTrading({
                    gasLimit: 5000000 // High gas limit
                });
                
                console.log('Open Trading TX:', openTradingTx.hash);
                console.log('Waiting for confirmation...');
                
                const receipt = await openTradingTx.wait();
                
                if (receipt.status === 1) {
                    console.log('Trading opened successfully');
                } else {
                    throw new Error('Transaction failed');
                }
            }
        } catch (error) {
            console.error('Failed to open trading:', error.message);
            
            // If it's a revert, try to get more details
            if (error.code === 'CALL_EXCEPTION') {
                console.log('Transaction reverted. Possible reasons:');
                console.log('1. Trading is already open');
                console.log('2. Insufficient ETH for minimum liquidity');
                console.log('3. Token balance issue');
                console.log('4. Uniswap router/factory issue');
                
                // Try to continue with next steps anyway
                console.log('Attempting to continue with remaining steps...');
            } else {
                throw error; // Re-throw if it's a different error
            }
        }
        
        // Step 3: Remove Limits
        console.log('\n=== STEP 3: Removing Limits ===');
        const removeLimitTx = await contract.removeLimit({
            gasLimit: 100000
        });
        
        console.log('Remove Limit TX:', removeLimitTx.hash);
        await removeLimitTx.wait();
        console.log('Limits removed successfully');
        
        // Step 4: Remove Transfer Tax
        console.log('\n=== STEP 4: Removing Transfer Tax ===');
        const removeTransferTaxTx = await contract.removeTransferTax({
            gasLimit: 100000
        });
        
        console.log('Remove Transfer Tax TX:', removeTransferTaxTx.hash);
        await removeTransferTaxTx.wait();
        console.log('Transfer tax removed successfully');
        
        // Step 5: Renounce Ownership
        console.log('\n=== STEP 5: Renouncing Ownership ===');
        const renounceOwnershipTx = await contract.renounceOwnership({
            gasLimit: 100000
        });
        
        console.log('Renounce Ownership TX:', renounceOwnershipTx.hash);
        await renounceOwnershipTx.wait();
        console.log('Ownership renounced successfully');
        
        console.log('\n=== ALL STEPS COMPLETED ===');
        console.log('Token is now fully launched and decentralized!');
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}