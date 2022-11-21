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

import {typeof SectionList as SectionListType} from '@react-native/flat-lists';

const SectionList: SectionListType =
  require('@react-native/flat-lists').SectionList;

export type {SectionListProps, SectionBase} from '@react-native/flat-lists';

module.exports = SectionList;
