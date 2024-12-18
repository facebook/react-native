/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import {SectionList_BaseOnViewableItemsChanged} from './SectionList-BaseOnViewableItemsChanged';
import * as React from 'react';

export default {
  title: 'onViewableItemsChanged horizontal',
  name: 'onViewableItemsChanged-horizontal-waitForInteraction',
  description:
    'E2E Test:\nonViewableItemsChanged-horizontal-waitForInteraction',
  hidden: true,
  render: function (): React.MixedElement {
    return (
      <SectionList_BaseOnViewableItemsChanged
        horizontal={true}
        waitForInteraction={true}
      />
    );
  },
};
