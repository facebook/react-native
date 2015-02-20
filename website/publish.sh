#!/bin/bash

set -e

# Start in website/ even if run from root directory
cd "$(dirname "$0")"

cd ../../react-native-gh-pages
git checkout -- .
git clean -dfx
git fetch
git rebase
rm -Rf *
cd ../react-native/website
node server/generate.js
cp -R build/react-native/* ../../react-native-gh-pages/
rm -Rf build/
cd ../../react-native-gh-pages
git add --all
git commit -m "update website"
git push
cd ../react-native/website
