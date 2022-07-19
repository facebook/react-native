/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

/* eslint-env node */

'use strict';

// NOTE: Avoiding using a package like 'chalk' here, for simplicity
const YELLOW = process.stderr.isTTY ? '\u001b[33m' : '';
const BOLD = process.stderr.isTTY ? '\u001b[1m' : '';
const RESET = process.stderr.isTTY ? '\u001b[0m' : '';
const UNDERLINE = process.stderr.isTTY ? '\u001b[4m' : '';

console.warn(
  '\n' +
    YELLOW +
    BOLD +
    'react-native/jest/preprocessor.js' +
    RESET +
    YELLOW +
    ' is deprecated and will be removed.\n' +
    'Use "preset": "react-native" in your Jest config instead.\n' +
    'See ' +
    UNDERLINE +
    'https://jestjs.io/docs/tutorial-react-native' +
    RESET +
    YELLOW +
    ' for more setup instructions.' +
    RESET +
    '\n',
);

module.exports = require('./preprocessor_DO_NOT_USE');
