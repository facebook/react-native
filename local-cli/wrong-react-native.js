#!/usr/bin/env node

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

console.error([
  '\033[31mLooks like you installed react-native globally, maybe you meant react-native-cli?',
  'To fix the issue, run:\033[0m',
  'npm uninstall -g react-native',
  'npm install -g react-native-cli'
].join('\n'));

process.exit(1);
