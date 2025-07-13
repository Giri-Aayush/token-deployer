#!/bin/bash

# Colors for output - Enhanced palette
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to display banner
display_banner() {
    clear
    echo -e "${CYAN}"
    echo "    ██╗      █████╗ ██╗   ██╗███╗   ██╗ ██████╗██╗  ██╗"
    echo "    ██║     ██╔══██╗██║   ██║████╗  ██║██╔════╝██║  ██║"
    echo "    ██║     ███████║██║   ██║██╔██╗ ██║██║     ███████║"
    echo "    ██║     ██╔══██║██║   ██║██║╚██╗██║██║     ██╔══██║"
    echo "    ███████╗██║  ██║╚██████╔╝██║ ╚████║╚██████╗██║  ██║"
    echo "    ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝"
    echo -e "${NC}"
    echo -e "${BOLD}    🚀 Automated Token Launch System v2.0${NC}"
    echo -e "${DIM}    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to get network configuration
get_network_config() {
    # Read .env file to get network setting
    if [ -f ".env" ]; then
        NETWORK=$(grep -E "^NETWORK=" .env | cut -d'=' -f2 | tr -d '"' | tr '[:upper:]' '[:lower:]')
    fi
    
    # Default to testnet if not specified
    if [ -z "$NETWORK" ]; then
        NETWORK="testnet"
    fi
    
    if [ "$NETWORK" = "mainnet" ]; then
        NETWORK_NAME="Ethereum Mainnet"
        EXPLORER_URL="https://etherscan.io"
    else
        NETWORK_NAME="Sepolia Testnet"
        EXPLORER_URL="https://sepolia.etherscan.io"
    fi
}

# Function to log with colors
log_header() {
    echo -e "\n${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
}

log_subheader() {
    echo -e "\n${MAGENTA}📋 $1${NC}"
    echo -e "${DIM}─────────────────────────────────────────────${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to log to both console and file
log_to_file() {
    echo "$1" | sed 's/\x1b\[[0-9;]*m//g' >> "$LOG_FILE" 2>/dev/null
}

# Function to setup logging
setup_logging() {
    TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
    LOG_FILE="launch_${TIMESTAMP}.log"
    
    # Create log file and add header
    echo "=== TOKEN LAUNCH LOG ===" > "$LOG_FILE"
    echo "Timestamp: $(date)" >> "$LOG_FILE"
    echo "==============================" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
}

# Enhanced logging functions that also write to file
log_header() {
    local message="$1"
    echo -e "\n${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}$message${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    
    log_to_file ""
    log_to_file "═══════════════════════════════════════════════════════════"
    log_to_file "$message"
    log_to_file "═══════════════════════════════════════════════════════════"
}

log_subheader() {
    local message="$1"
    echo -e "\n${MAGENTA}📋 $message${NC}"
    echo -e "${DIM}─────────────────────────────────────────────${NC}"
    
    log_to_file ""
    log_to_file "📋 $message"
    log_to_file "─────────────────────────────────────────────"
}

log_success() {
    local message="$1"
    echo -e "${GREEN}✅ $message${NC}"
    log_to_file "✅ $message"
}

log_error() {
    local message="$1"
    echo -e "${RED}❌ $message${NC}"
    log_to_file "❌ $message"
}

log_warning() {
    local message="$1"
    echo -e "${YELLOW}⚠️  $message${NC}"
    log_to_file "⚠️  $message"
}

log_info() {
    local message="$1"
    echo -e "${BLUE}ℹ️  $message${NC}"
    log_to_file "ℹ️  $message"
}

# Main script starts here
display_banner

# Setup logging
setup_logging

# Get network configuration
get_network_config

log_subheader "SYSTEM INITIALIZATION"
log_info "Network: $NETWORK_NAME"
log_info "Explorer: $EXPLORER_URL"

# Step 1: Check if required files exist
log_info "Checking required files..."
if [ ! -f "deploy.js" ] || [ ! -f "verify.js" ]; then
    log_error "deploy.js or verify.js not found"
    echo -e "${WHITE}   Required files: deploy.js, verify.js${NC}"
    exit 1
fi
log_success "All required files found"

# Step 2: Check if deployment.json exists from previous deployment
if [ -f "deployment.json" ]; then
    log_warning "deployment.json exists from previous deployment"
    echo -e "${YELLOW}This will be overwritten. Continue? (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_error "Launch cancelled by user"
        exit 1
    fi
fi

# Step 3: Run deployment
log_subheader "STEP 1: TOKEN DEPLOYMENT"
log_info "Starting token deployment..."

# Capture deployment output
echo "=== DEPLOYMENT OUTPUT ===" >> "$LOG_FILE"
node deploy.js 2>&1 | tee -a "$LOG_FILE"
DEPLOY_EXIT_CODE=${PIPESTATUS[0]}

# Check if deployment was successful
if [ $DEPLOY_EXIT_CODE -ne 0 ] || [ ! -f "deployment.json" ]; then
    log_error "Deployment failed or deployment.json not created"
    echo "Deployment failed with exit code: $DEPLOY_EXIT_CODE" >> "$LOG_FILE"
    exit 1
fi

# Get token info from deployment.json
if command -v jq > /dev/null; then
    TOKEN_NAME=$(jq -r '.name' deployment.json 2>/dev/null)
    TOKEN_SYMBOL=$(jq -r '.symbol' deployment.json 2>/dev/null)
    CONTRACT_ADDRESS=$(jq -r '.address' deployment.json 2>/dev/null)
    NETWORK_FROM_JSON=$(jq -r '.network' deployment.json 2>/dev/null)
else
    # Fallback if jq is not available
    TOKEN_SYMBOL=$(grep -o '"symbol":"[^"]*"' deployment.json | cut -d'"' -f4)
    TOKEN_NAME=$(grep -o '"name":"[^"]*"' deployment.json | cut -d'"' -f4)
    CONTRACT_ADDRESS=$(grep -o '"address":"[^"]*"' deployment.json | cut -d'"' -f4)
    NETWORK_FROM_JSON=$(grep -o '"network":"[^"]*"' deployment.json | cut -d'"' -f4)
fi

if [ -z "$TOKEN_SYMBOL" ] || [ -z "$CONTRACT_ADDRESS" ]; then
    log_error "Failed to extract token info from deployment.json"
    exit 1
fi

log_success "Deployment successful!"
echo -e "${WHITE}   📄 Token: $TOKEN_NAME ($TOKEN_SYMBOL)${NC}"
echo -e "${WHITE}   📍 Address: $CONTRACT_ADDRESS${NC}"
echo -e "${WHITE}   🌐 Network: ${NETWORK_FROM_JSON:-$NETWORK_NAME}${NC}"

# Step 4: Wait for network confirmation
log_subheader "STEP 2: NETWORK CONFIRMATION"
log_info "Waiting 60 seconds for network confirmation..."
for i in {60..1}; do
    printf "\r${BLUE}   ⏳ Waiting: %02d seconds${NC}" $i
    sleep 1
done
printf "\r${GREEN}   ✅ Network confirmation complete!     ${NC}\n"

# Step 5: Run verification
log_subheader "STEP 3: CONTRACT VERIFICATION"
log_info "Starting contract verification..."

# Capture verification output
echo "" >> "$LOG_FILE"
echo "=== VERIFICATION OUTPUT ===" >> "$LOG_FILE"
node verify.js 2>&1 | tee -a "$LOG_FILE"
VERIFY_EXIT_CODE=${PIPESTATUS[0]}

if [ $VERIFY_EXIT_CODE -ne 0 ]; then
    log_warning "Verification failed, but continuing with file organization..."
    echo "Verification failed with exit code: $VERIFY_EXIT_CODE" >> "$LOG_FILE"
else
    log_success "Verification completed successfully!"
fi

# Step 6: Organize files
log_subheader "STEP 4: FILE ORGANIZATION"
log_info "Organizing files for $TOKEN_SYMBOL..."

# Create token-specific directory
mkdir -p "contracts/$TOKEN_SYMBOL"

# Check if contract file exists and move it
if [ -f "contracts/$TOKEN_SYMBOL.sol" ]; then
    mv "contracts/$TOKEN_SYMBOL.sol" "contracts/$TOKEN_SYMBOL/token.sol"
    log_success "Contract file → contracts/$TOKEN_SYMBOL/token.sol"
else
    log_warning "Contract file contracts/$TOKEN_SYMBOL.sol not found"
fi

# Move deployment.json
if [ -f "deployment.json" ]; then
    mv "deployment.json" "contracts/$TOKEN_SYMBOL/deployment.json"
    log_success "Deployment info → contracts/$TOKEN_SYMBOL/deployment.json"
else
    log_error "deployment.json not found"
fi

# Move log file to token directory
if [ -f "$LOG_FILE" ]; then
    mv "$LOG_FILE" "contracts/$TOKEN_SYMBOL/launch.log"
    log_success "Launch log → contracts/$TOKEN_SYMBOL/launch.log"
    # Update LOG_FILE path for any remaining logging
    LOG_FILE="contracts/$TOKEN_SYMBOL/launch.log"
else
    log_warning "Log file not found"
fi

# Step 7: Display final results
log_header "🎉 TOKEN LAUNCH COMPLETED SUCCESSFULLY!"

echo -e "${MAGENTA}📊 Token Details:${NC}"
echo -e "${WHITE}   Name: $TOKEN_NAME${NC}"
echo -e "${WHITE}   Symbol: $TOKEN_SYMBOL${NC}"
echo -e "${WHITE}   Contract: $CONTRACT_ADDRESS${NC}"
echo -e "${WHITE}   Network: ${NETWORK_FROM_JSON:-$NETWORK_NAME}${NC}"

echo -e "\n${MAGENTA}📁 Files Location:${NC}"
echo -e "${WHITE}   Contract: contracts/$TOKEN_SYMBOL/token.sol${NC}"
echo -e "${WHITE}   Deployment: contracts/$TOKEN_SYMBOL/deployment.json${NC}"
echo -e "${WHITE}   Launch Log: contracts/$TOKEN_SYMBOL/launch.log${NC}"

log_to_file ""
log_to_file "📁 Files Location:"
log_to_file "   Contract: contracts/$TOKEN_SYMBOL/token.sol"
log_to_file "   Deployment: contracts/$TOKEN_SYMBOL/deployment.json"
log_to_file "   Launch Log: contracts/$TOKEN_SYMBOL/launch.log"

echo -e "\n${MAGENTA}🔗 Useful Links:${NC}"
echo -e "${CYAN}   📋 Contract: $EXPLORER_URL/address/$CONTRACT_ADDRESS${NC}"
echo -e "${CYAN}   📄 Source Code: $EXPLORER_URL/address/$CONTRACT_ADDRESS#code${NC}"
echo -e "${CYAN}   📊 Read Contract: $EXPLORER_URL/address/$CONTRACT_ADDRESS#readContract${NC}"
echo -e "${CYAN}   ✍️  Write Contract: $EXPLORER_URL/address/$CONTRACT_ADDRESS#writeContract${NC}"

echo -e "\n${MAGENTA}📋 Next Steps:${NC}"
echo -e "${WHITE}   1. 💰 Send ETH to contract: $CONTRACT_ADDRESS${NC}"
echo -e "${WHITE}   2. 🟢 Call openTrading() function${NC}"
echo -e "${WHITE}   3. 🔥 Burn LP tokens${NC}"
echo -e "${WHITE}   4. 🚫 Remove limits${NC}"
echo -e "${WHITE}   5. 🔐 Renounce ownership${NC}"

echo -e "\n${YELLOW}💡 To verify this token later: ${BOLD}node verify.js $TOKEN_SYMBOL${NC}"

# Show only the just deployed token
echo -e "\n${MAGENTA}📂 Deployed Token:${NC}"
echo -e "${WHITE}   📄 $TOKEN_SYMBOL: $CONTRACT_ADDRESS ${DIM}(${NETWORK_FROM_JSON:-$NETWORK_NAME})${NC}"

echo ""
echo -e "${GREEN}${BOLD}🎊 Launch completed successfully! 🎊${NC}"
echo -e "${DIM}Thank you for using the Token Launch System!${NC}"
echo ""

# Final log entries
log_to_file ""
log_to_file "🎊 Launch completed successfully! 🎊"
log_to_file "Thank you for using the Token Launch System!"
log_to_file ""
log_to_file "=== END OF LOG ==="
log_to_file "Completed at: $(date)"