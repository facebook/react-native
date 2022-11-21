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

import {typeof FlatList as FlatListType} from '@react-native/flat-lists';

const FlatList: FlatListType = require('@react-native/flat-lists').FlatList;

export type {FlatListProps} from '@react-native/flat-lists';

module.exports = FlatList;
