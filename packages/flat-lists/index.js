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

import typeof FlatList from './Lists/FlatList';
import typeof SectionList from './Lists/SectionList';

export type {Props as FlatListProps} from './Lists/FlatList';
export type {Props as SectionListProps, SectionBase} from './Lists/SectionList';

module.exports = {
  get FlatList(): FlatList {
    return require('./Lists/FlatList');
  },
  get SectionList(): SectionList {
    return require('./Lists/SectionList');
  },
  get SectionListModern(): $FlowFixMe {
    return require('./Lists/SectionListModern');
  },
};
