#!/bin/bash

set -e

script_dir=$(dirname "$(readlink -f "$0")")

HELLOWORLD_PATH=$(realpath ../)
REACT_NATIVE_PATH=$(realpath ../../react-native)

cat "$script_dir/../.react-native.config" \
  | sed "s|HELLOWORLD_PATH|$HELLOWORLD_PATH|g" \
  | sed "s|REACT_NATIVE_PATH|$REACT_NATIVE_PATH|g"
