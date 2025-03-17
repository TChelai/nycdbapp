#!/bin/bash

# Test script for NYCDB Web Application
# This script tests the backend API endpoints

# Set variables
API_URL="http://localhost:5000/api"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ $2${NC}"
  else
    echo -e "${RED}✗ $2${NC}"
    echo "  Response: $3"
  fi
}

echo "Starting NYCDB Web Application API Tests"
echo "========================================"

# Test 1: Health check
echo -e "\nTest 1: Health check"
response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
print_result $? "Health check endpoint" $response

# Test 2: Get all datasets
echo -e "\nTest 2: Get all datasets"
response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/datasets)
print_result $? "Get all datasets endpoint" $response

# Test 3: Register a new user
echo -e "\nTest 3: Register a new user"
register_response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser", "email":"test@example.com", "password":"password123"}' \
  $API_URL/auth/register)
  
token=$(echo $register_response | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
if [ -n "$token" ]; then
  TOKEN=$token
  print_result 0 "Register user endpoint"
else
  print_result 1 "Register user endpoint" "$register_response"
fi

# Test 4: Login with the new user
echo -e "\nTest 4: Login with the new user"
login_response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", "password":"password123"}' \
  $API_URL/auth/login)
  
token=$(echo $login_response | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
if [ -n "$token" ]; then
  TOKEN=$token
  print_result 0 "Login endpoint"
else
  print_result 1 "Login endpoint" "$login_response"
fi

# Test 5: Get user profile (authenticated)
echo -e "\nTest 5: Get user profile (authenticated)"
if [ -n "$TOKEN" ]; then
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    $API_URL/auth/me)
  print_result $? "Get user profile endpoint" $response
else
  print_result 1 "Get user profile endpoint" "No token available"
fi

# Test 6: Get dataset metadata
echo -e "\nTest 6: Get dataset metadata"
response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/datasets/hpd_violations)
print_result $? "Get dataset metadata endpoint" $response

# Test 7: Get dataset data
echo -e "\nTest 7: Get dataset data"
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/datasets/hpd_violations/data?limit=10")
print_result $? "Get dataset data endpoint" $response

# Test 8: Save user preferences (authenticated)
echo -e "\nTest 8: Save user preferences (authenticated)"
if [ -n "$TOKEN" ]; then
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"preferences":{"theme":"dark","defaultPageSize":"50"}}' \
    $API_URL/user/preferences)
  print_result $? "Save user preferences endpoint" $response
else
  print_result 1 "Save user preferences endpoint" "No token available"
fi

# Test 9: Get user preferences (authenticated)
echo -e "\nTest 9: Get user preferences (authenticated)"
if [ -n "$TOKEN" ]; then
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    $API_URL/user/preferences)
  print_result $? "Get user preferences endpoint" $response
else
  print_result 1 "Get user preferences endpoint" "No token available"
fi

# Test 10: Save a query (authenticated)
echo -e "\nTest 10: Save a query (authenticated)"
if [ -n "$TOKEN" ]; then
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Test Query","dataset":"hpd_violations","query":{"filter":"","order":"","limit":25},"description":"Test query description"}' \
    $API_URL/user/saved-queries)
  print_result $? "Save query endpoint" $response
else
  print_result 1 "Save query endpoint" "No token available"
fi

echo -e "\nAPI Tests Completed"
