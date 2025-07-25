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

import {typeof VirtualizedListContextResetter as VirtualizedListContextResetterType} from '@react-native-macos/virtualized-lists'; // [macOS]

const VirtualizedListContextResetter: VirtualizedListContextResetterType =
  require('@react-native-macos/virtualized-lists').VirtualizedListContextResetter; // [macOS]

module.exports = {VirtualizedListContextResetter};
