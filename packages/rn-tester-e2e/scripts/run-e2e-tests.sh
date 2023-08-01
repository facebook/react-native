#!/bin/bash

# Supported platforms
SUPPORTED_PLATFORMS=("ios" "android")

# Check if an argument is provided and if it's a supported platform
if [ $# -ne 1 ] || ! [[ " ${SUPPORTED_PLATFORMS[*]} " == *" $1 "* ]]; then
  echo "Error: Invalid platform. Supported platforms are: ${SUPPORTED_PLATFORMS[*]}"
  exit 1
fi

# Run tests
E2E_DEVICE=$1 jest --runInBand
