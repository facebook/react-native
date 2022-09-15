/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const fs = require('fs');

const filePath = process.argv[2];
const file = fs.readFileSync(filePath).toString();
const toReplace = '(cd "./build_$1" && make install/strip)';
const replacement =
  'NUM_CORES=$(sysctl -n hw.ncpu)\n\techo "[Build Apple] Running with ${NUM_CORES} cores"\n\t(cd "./build_$1" && make install/strip -j "${NUM_CORES}")';
const replaced = file.replace(toReplace, replacement);
fs.writeFileSync(filePath, replaced);
