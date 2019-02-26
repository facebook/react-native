#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -ex

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname $SCRIPTS)

# Specify `SPEC_REPO` as an env variable if you want to push to a specific spec repo.
# Defaults to `react-test`, which is meant to be a dummy repo used to test that the specs fully lint.
: ${SPEC_REPO:="react-test"}
SPEC_REPO_DIR="$HOME/.cocoapods/repos/$SPEC_REPO"

# If the `SPEC_REPO` does not exist yet, assume this is purely for testing and create a dummy repo.
if ! [ -d "$SPEC_REPO_DIR" ]; then
  mkdir -p "$SPEC_REPO_DIR"
  cd "$SPEC_REPO_DIR"
  touch .gitkeep
  git init
  git add .
  git commit -m "init"
  git remote add origin "https://example.com/$SPEC_REPO.git"
fi

cd "$SPEC_REPO_DIR"
SPEC_REPOS="$(git remote get-url origin),https://github.com/CocoaPods/Specs.git"

POD_LINT_OPT="--verbose --allow-warnings --fail-fast --private --swift-version=3.0 --sources=$SPEC_REPOS"

# Get the version from a podspec.
version() {
  ruby -rcocoapods-core -rjson -e "puts Pod::Specification.from_file('$1').version"
}

# Lint both framework and static library builds.
lint() {
  local SUBSPEC=$1
  if [ "${SUBSPEC:-}" ]; then
    local SUBSPEC_OPT="--subspec=$SUBSPEC"
  fi
  pod lib lint $SUBSPEC_OPT $POD_LINT_OPT
  pod lib lint $SUBSPEC_OPT $POD_LINT_OPT --use-libraries
}

# Push the spec in arg `$1`, which is expected to be in the cwd, to the `SPEC_REPO` in JSON format.
push() {
  local SPEC_NAME=$1
  local POD_NAME=$(basename $SPEC_NAME .podspec)
  local SPEC_DIR="$SPEC_REPO_DIR/$POD_NAME/$(version $SPEC_NAME)"
  local SPEC_PATH="$SPEC_DIR/$SPEC_NAME.json"
  mkdir -p $SPEC_DIR
  env INSTALL_YOGA_WITHOUT_PATH_OPTION=1 INSTALL_YOGA_FROM_LOCATION="$ROOT" pod ipc spec $SPEC_NAME > $SPEC_PATH
}

# Perform linting and publishing of podspec in cwd.
# Skip linting with `SKIP_LINT` if e.g. publishing to a private spec repo.
process() {
  cd $1
  if [ -z "$SKIP_LINT" ]; then
    lint $2
  fi
  local SPEC_NAME=(*.podspec)
  push $SPEC_NAME
}

# Make third-party deps accessible
cd "$ROOT/third-party-podspecs"
push Folly.podspec
push DoubleConversion.podspec
push glog.podspec

process "$ROOT/ReactCommon/yoga"
process "$ROOT" _ignore_me_subspec_for_linting_
