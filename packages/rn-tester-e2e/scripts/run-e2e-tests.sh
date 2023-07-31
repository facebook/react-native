#!/bin/bash

# Check if an argument is provided
if [ $# -eq 0 ]; then
  echo "Error: No platform provided."
  exit 1
fi

# Run tests
E2E_DEVICE=$1 jest --runInBand
