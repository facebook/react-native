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
  title: 'onViewableItemsChanged offScreen',
  name: 'onViewableItemsChanged-offScreen-noWaitForInteraction',
  description:
    'E2E Test:\nonViewableItemsChanged-offScreen-noWaitForInteraction',
  hidden: true,
  render: function (): React.MixedElement {
    return (
      <SectionList_BaseOnViewableItemsChanged
        offScreen={true}
        waitForInteraction={false}
      />
    );
  },
};
