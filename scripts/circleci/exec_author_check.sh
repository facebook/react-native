#!/bin/bash

# This is meant to be used to keep failing tests from
# running for regular contributors, while still letting
# them run on PRs submitted by core contributors.
# Useful when working to bring a failing step back to green.

# Add yourself here if you'd like to pass the whitelist.
# Once N > 1 we should change this into an array check.
echo "Skipping" "$@" ", branch is stable"
