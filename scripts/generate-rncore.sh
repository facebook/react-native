#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

find "$PWD/Libraries" -name "*Schema.js" -print0 | xargs yarn flow-node packages/react-native-codegen/buck_tests/combine-js-to-schema-cli.js schema-rncore.json
yarn flow-node packages/react-native-codegen/buck_tests/generate-tests.js schema-rncore.json rncore ReactCommon/fabric/components/rncore
