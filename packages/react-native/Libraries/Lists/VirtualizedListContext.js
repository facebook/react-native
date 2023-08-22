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

import {typeof VirtualizedListContextResetter as VirtualizedListContextResetterType} from '@react-native-mac/virtualized-lists'; // [macOS]

const VirtualizedListContextResetter: VirtualizedListContextResetterType =
  require('@react-native-mac/virtualized-lists').VirtualizedListContextResetter; // [macOS]

module.exports = {VirtualizedListContextResetter};
