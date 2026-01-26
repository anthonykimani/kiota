#!/bin/bash

# Swap API Test Script
# Quick automated testing of swap endpoints

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3003/api/swap"
FROM_ASSET="${FROM_ASSET:-USDC}"
TO_ASSET="${TO_ASSET:-USDM}"
AMOUNT="${AMOUNT:-10}"

echo -e "${YELLOW}=== Swap API Test Script ===${NC}\n"

# Step 1: Generate auth token
echo -e "${YELLOW}Step 1: Generating auth token...${NC}"
PAYLOAD=$(cat <<EOF
{"userId":"test-user-123","iat":$(date +%s)000,"exp":$(($(date +%s) + 3600))000}
EOF
)
TOKEN=$(echo -n "$PAYLOAD" | base64)
AUTH_HEADER="Authorization: Bearer $TOKEN"
echo -e "${GREEN}✓ Token generated${NC}\n"

# Step 2: Test quote endpoint
echo -e "${YELLOW}Step 2: Testing quote endpoint...${NC}"
echo "  FROM: $FROM_ASSET"
echo "  TO: $TO_ASSET"
echo "  AMOUNT: $AMOUNT"
echo ""

QUOTE_RESPONSE=$(curl -s -X GET "$API_URL/quote?fromAsset=$FROM_ASSET&toAsset=$TO_ASSET&amount=$AMOUNT" \
  -H "$AUTH_HEADER")

QUOTE_STATUS=$(echo "$QUOTE_RESPONSE" | jq -r '.status')
if [ "$QUOTE_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Quote successful${NC}"
  echo "$QUOTE_RESPONSE" | jq '.data'
  echo ""
else
  echo -e "${RED}✗ Quote failed${NC}"
  echo "$QUOTE_RESPONSE" | jq
  exit 1
fi

# Step 3: Execute swap
echo -e "${YELLOW}Step 3: Executing swap...${NC}"

SWAP_RESPONSE=$(curl -s -X POST "$API_URL/execute" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "{\"fromAsset\":\"$FROM_ASSET\",\"toAsset\":\"$TO_ASSET\",\"amount\":$AMOUNT}")

SWAP_STATUS=$(echo "$SWAP_RESPONSE" | jq -r '.status')
if [ "$SWAP_STATUS" = "201" ]; then
  echo -e "${GREEN}✓ Swap initiated${NC}"
  TX_ID=$(echo "$SWAP_RESPONSE" | jq -r '.data.transactionId')
  echo "  Transaction ID: $TX_ID"
  echo ""
else
  echo -e "${RED}✗ Swap execution failed${NC}"
  echo "$SWAP_RESPONSE" | jq
  exit 1
fi

# Step 4: Poll status
echo -e "${YELLOW}Step 4: Polling swap status...${NC}"
echo "  Checking status every 10 seconds (max 60 attempts = 10 minutes)"
echo ""

for i in {1..60}; do
  STATUS_RESPONSE=$(curl -s -X GET "$API_URL/status/$TX_ID" -H "$AUTH_HEADER")
  CURRENT_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.status')

  echo -e "  [$i/60] Status: ${YELLOW}$CURRENT_STATUS${NC}"

  if [ "$CURRENT_STATUS" = "completed" ]; then
    echo ""
    echo -e "${GREEN}✓ Swap completed successfully!${NC}"
    echo "$STATUS_RESPONSE" | jq '.data'

    # Show transaction hash if available
    TX_HASH=$(echo "$STATUS_RESPONSE" | jq -r '.data.txHash')
    if [ "$TX_HASH" != "null" ] && [ -n "$TX_HASH" ]; then
      echo ""
      echo "View on Etherscan:"
      if [[ "$ONEINCH_NETWORK" == *"sepolia"* ]]; then
        echo "https://sepolia.etherscan.io/tx/$TX_HASH"
      else
        echo "https://etherscan.io/tx/$TX_HASH"
      fi
    fi

    exit 0
  elif [ "$CURRENT_STATUS" = "failed" ]; then
    echo ""
    echo -e "${RED}✗ Swap failed${NC}"
    echo "$STATUS_RESPONSE" | jq '.data'
    exit 1
  fi

  sleep 10
done

echo ""
echo -e "${RED}✗ Timeout: Swap did not complete within 10 minutes${NC}"
echo "  Transaction ID: $TX_ID"
echo "  Check Bull Board: http://localhost:3003/admin/queues"
exit 1
