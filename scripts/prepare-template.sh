#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

PACKAGE_LOCATION=$(pwd)/react-native-$1.tgz

# Part 1:
#
# Pack React Native into a `.tgz` file so we can run from source
npm pack

# Set the React Native version to point to the `.tgz` file
node scripts/set-rn-template-version.js "file:$PACKAGE_LOCATION"
success "React Native version changed in the template"

# Part 2:
#
# We need to generate CocoaPods project. To do so, we install depdendencies
# locally and manually run `pod install`
cd template

npm install
(cd ios && pod install)

# Dependencies are installed on the client-side
rm -rf node_modules
