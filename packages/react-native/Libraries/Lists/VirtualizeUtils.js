/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import {typeof keyExtractor as KeyExtractorType} from '@react-native-macos/virtualized-lists'; // [macOS]

const keyExtractor: KeyExtractorType =
  require('@react-native-macos/virtualized-lists').keyExtractor; // [macOS]

module.exports = {keyExtractor};
