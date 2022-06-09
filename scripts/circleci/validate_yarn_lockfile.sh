#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Abort the mission if any command fails
set -e

# Allow the script to be invoked from various environments
if [[ -z "${OVERRIDE_YARN_BINARY}" ]]; then
  YARN_BINARY=$(command -v yarn)
else
  YARN_BINARY="${OVERRIDE_YARN_BINARY}"
fi

REACT_NATIVE_TEMP_DIR=$(mktemp -d /tmp/react-native-XXXXXXXX)

function cleanup {
  set +e
  rm -rf "$REACT_NATIVE_TEMP_DIR"
  set -e
}

function msg {
  echo -e " "
  echo -e "\\x1B[36m${1}\\x1B[0m";
  echo -e "\\x1B[36m${1//?/=}\\x1B[0m"
}

trap cleanup EXIT

cp -R ./package.json "$REACT_NATIVE_TEMP_DIR"
cp -R ./yarn.lock "$REACT_NATIVE_TEMP_DIR"
pushd "$REACT_NATIVE_TEMP_DIR" >/dev/null

if ! $YARN_BINARY --ignore-scripts --silent --non-interactive --mutex network --frozen-lockfile; then
  msg "Yarn validation failed."
  echo "This means the package.json and yarn.lock disagree in some way."
  echo "Try fixing it by running \`yarn\` and committing the changes."
fi

popd >/dev/null
