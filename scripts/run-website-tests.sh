#!/bin/bash

# Runs all website tests locally.
# See http://facebook.github.io/react-native/docs/testing.html

set -e

cd website
node server/generate.js
