/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import typeof VirtualizedList from './Lists/VirtualizedList';
import typeof VirtualizedSectionList from './Lists/VirtualizedSectionList';

module.exports = {
  get VirtualizedList(): VirtualizedList {
    return require('./Lists/VirtualizedList').default;
  },
  get VirtualizedSectionList(): VirtualizedSectionList {
    return require('./Lists/VirtualizedSectionList');
  },
};
