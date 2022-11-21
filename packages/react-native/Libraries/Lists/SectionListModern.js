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

import {typeof SectionListModern as SectionListModernType} from '@react-native/flat-lists';

const SectionList: SectionListModernType =
  require('@react-native/flat-lists').SectionListModern;

export type {SectionListProps, SectionBase} from '@react-native/flat-lists';

module.exports = SectionList;
