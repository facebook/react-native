#!/bin/bash

# Copyright (c) 2015-present, Facebook, Inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree. An additional grant
# of patent rights can be found in the PATENTS file in the same directory.

# This script publishes to gh-pages of the private github repo.
# It assumes you have a react-native-android-gh-pages folder next to your react-native-android folder.
# You can clone that using:
# git clone -b gh-pages git@github.com:facebook/react-native-android.git react-native-android-gh-pages

set -e

# Start in website/ even if run from root directory
cd "$(dirname "$0")"

cd ../../react-native-android-gh-pages
git checkout -- .
git clean -dfx
git fetch
git rebase
rm -Rf *
cd ../react-native-android/website
node server/generate.js
cp -R build/react-native/* ../../react-native-android-gh-pages/
rm -Rf build/
cd ../../react-native-android-gh-pages
git status
if ! git diff-index --quiet HEAD --; then
  git add -A .
  git commit -m "update website"
  git push origin gh-pages
fi
