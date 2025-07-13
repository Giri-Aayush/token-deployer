# Token Deployer

Professional automated token deployment and verification system for Ethereum networks with built-in contract compilation, deployment tracking, and Etherscan verification.

## Features

- **Automated Token Deployment**: Deploy ERC-20 tokens with configurable parameters
- **Contract Verification**: Automatic Etherscan source code verification
- **Multi-Network Support**: Ethereum Mainnet and Sepolia Testnet
- **Interactive CLI**: Professional command-line interface with colored output
- **Comprehensive Logging**: Complete audit trail of all operations
- **File Organization**: Automatic project structure management
- **Gas Optimization**: Built-in optimization with 200 runs
- **Real-time Price Tracking**: ETH price conversion for deployment costs
- **Template-Based Contract Generation**: Dynamic contract creation based on user inputs

## Prerequisites

- Node.js >= 16.x
- npm package manager
- Ethereum wallet with sufficient ETH balance
- Etherscan API key for contract verification

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Giri-Aayush/token-deployer.git
cd token-deployer
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

## Environment Configuration

Edit the `.env` file with your configuration:

```bash
# Private key for the main deployment wallet (remove 0x prefix)
MAIN_PRIVATE_KEY=your_private_key_without_0x

# RPC URL for Sepolia testnet (Ethereum test network)
TESTNET_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# RPC URL for Ethereum mainnet
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY

# Network selection: 'testnet' for Sepolia or 'mainnet' for Ethereum mainnet
NETWORK=testnet
```

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MAIN_PRIVATE_KEY` | Wallet private key (without 0x prefix) | Yes |
| `TESTNET_RPC_URL` | Sepolia testnet RPC endpoint | Yes |
| `MAINNET_RPC_URL` | Ethereum mainnet RPC endpoint | Yes |
| `ETHERSCAN_API_KEY` | Etherscan API key for verification | Yes |
| `NETWORK` | Target network (testnet/mainnet) | Yes |

## Usage

### Automated Launch (Recommended)

Execute the complete deployment workflow:

```bash
chmod +x launch-token.sh
./launch-token.sh
```

This script performs the following operations:
1. Token contract deployment
2. Network confirmation wait period
3. Etherscan contract verification
4. File organization and logging

### Manual Deployment

#### Deploy Token Contract

```bash
node deploy.js
```

Interactive prompts will collect:
- Token name
- Token symbol
- Website URL (optional)
- Telegram link (optional)
- Twitter handle (optional)

#### Verify Contract

After deployment, verify the contract on Etherscan:

```bash
node verify.js
```

For specific token verification:
```bash
node verify.js TOKEN_SYMBOL
```

## Project Structure

```
token-deployer/
├── contracts/
│   └── [TOKEN_SYMBOL]/
│       ├── token.sol          # Generated contract source
│       ├── deployment.json    # Deployment metadata
│       └── launch.log         # Complete execution log
├── deploy.js                  # Main deployment script
├── verify.js                  # Contract verification script
├── launch-token.sh           # Automated launch workflow
├── package.json              # Node.js dependencies
├── .env                      # Environment configuration
├── .env.example              # Environment template
└── .gitignore                # Git ignore rules
```

## Contract Template Features

The deployment system generates ERC-20 compliant contracts with:
- Dynamic token name and symbol configuration
- Social media integration (website, telegram, twitter)
- Standard token functionality with customizable parameters
- Built-in trading mechanics and fee structures
- Uniswap integration for liquidity management

## Network Configuration

### Sepolia Testnet
- **Chain ID**: 11155111
- **Explorer**: https://sepolia.etherscan.io
- **RPC**: Infura/Alchemy endpoint required

### Ethereum Mainnet
- **Chain ID**: 1
- **Explorer**: https://etherscan.io
- **RPC**: Infura/Alchemy endpoint required

## Gas Estimation

Typical deployment costs:
- **Contract Deployment**: ~3,500,000 gas
- **Gas Price**: 20 gwei (configurable)
- **Estimated Cost**: ~0.07 ETH (variable with network conditions)

## Security Considerations

- Private keys are loaded from environment variables only
- No sensitive data is logged or committed
- Contract includes standard security patterns
- Ownership can be renounced after launch

## Troubleshooting

### Common Issues

**Insufficient Balance**
```bash
Error: insufficient funds for gas
```
Solution: Ensure wallet has adequate ETH balance

**RPC Connection Failed**
```bash
Error: could not detect network
```
Solution: Verify RPC URL and network connectivity

**Verification Failed**
```bash
Error: compilation failed
```
Solution: Check compiler version and optimization settings

### Support Commands

Check available tokens:
```bash
ls contracts/
```

View deployment details:
```bash
cat contracts/[TOKEN_SYMBOL]/deployment.json
```

Review launch logs:
```bash
cat contracts/[TOKEN_SYMBOL]/launch.log
```

## API Integration

### Etherscan Verification Parameters
- **Compiler**: v0.8.24+commit.e11b9ed9
- **EVM Version**: shanghai
- **Optimization**: Enabled (200 runs)
- **License**: Unlicense

## License

This project is released under the UNLICENSE. See contract headers for specific licensing terms.

## Disclaimer

This software is provided as-is for educational and development purposes. Users are responsible for compliance with applicable laws and regulations. 