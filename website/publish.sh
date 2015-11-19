#!/bin/bash

# Copyright (c) 2015-present, Facebook, Inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree. An additional grant
# of patent rights can be found in the PATENTS file in the same directory.

set -e

VERSION=`git describe | sed 's/-.*//'`
# Start in website/ even if run from root directory
cd "$(dirname "$0")"

cd ../../react-native-gh-pages
git checkout -- .
git clean -dfx
git fetch
git rebase
rm -Rf *
mkdir ${VERSION}
cd ../react-native/website
node server/generate.js
cp -R build/react-native/* ../../react-native-gh-pages/${VERSION}
rm -Rf build/
cd ../../react-native-gh-pages
git status
git add -A .
if ! git diff-index --quiet HEAD --; then
  git commit -m "update ${VERSION} of the website"
  git push origin gh-pages
fi
cd ../react-native/website
