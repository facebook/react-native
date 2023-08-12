/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import {typeof keyExtractor as KeyExtractorType} from '@react-native-mac/virtualized-lists'; // [macOS]

const keyExtractor: KeyExtractorType =
  require('@react-native-mac/virtualized-lists').keyExtractor; // [macOS]

module.exports = {keyExtractor};
