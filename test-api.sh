#!/bin/bash

# NEPSE Dashboard - Test Script
# Tests against PRODUCTION API

BASE_URL="https://frontend-eight-tan-70.vercel.app/api"
PASS=0
FAIL=0

test_endpoint() {
  local name="$1"
  local url="$2"
  local expected="$3"

  echo -n "Testing $name... "
  response=$(curl -s "$url" 2>/dev/null)

  if [ $? -ne 0 ]; then
    echo "❌ FAILED (curl error)"
    ((FAIL++))
    return
  fi

  if echo "$response" | grep -q "$expected"; then
    echo "✅ PASSED"
    ((PASS++))
  else
    echo "❌ FAILED"
    echo "   Response: $(echo "$response" | head -c 200)"
    ((FAIL++))
  fi
}

echo "========================================"
echo "NEPSE Dashboard - API Test (Production)"
echo "========================================"
echo ""

echo "1. Database APIs (Neon)"
test_endpoint "History API" "$BASE_URL/history?symbol=NABIL&days=1" "NABIL"
test_endpoint "Analysis API" "$BASE_URL/analysis?symbol=NABIL" "rsi"
test_endpoint "Predict API" "$BASE_URL/predict?symbol=NABIL" "prediction"
echo ""

echo "2. Live Data APIs (YONEPSE)"
test_endpoint "All Stocks" "$BASE_URL/stocks" "symbol"
test_endpoint "Market Status" "$BASE_URL/market/status" "is_open"
test_endpoint "Market Summary" "$BASE_URL/market/summary" "summary"
echo ""

echo "3. All Available Symbols"
test_endpoint "GBL" "$BASE_URL/history?symbol=GBL&days=1" "GBL"
test_endpoint "NABIL" "$BASE_URL/history?symbol=NABIL&days=1" "NABIL"
test_endpoint "NIC" "$BASE_URL/history?symbol=NIC&days=1" "NIC"
test_endpoint "SCB" "$BASE_URL/history?symbol=SCB&days=1" "SCB"
test_endpoint "NMB" "$BASE_URL/history?symbol=NMB&days=1" "NMB"
echo ""

echo "========================================"
echo "Results: $PASS passed, $FAIL failed"
echo "========================================"

if [ $FAIL -eq 0 ]; then
  echo "🎉 All APIs working! Ready to build UI."
  exit 0
else
  echo "⚠️  Some APIs failed."
  exit 1
fi
