/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 * @flow strict-local
 */

'use strict';

import * as React from 'react';

import Pressable from '../Pressable';
import View from '../../View/View';
import {expectRendersMatchingSnapshot} from '../../../Utilities/ReactNativeTestTools';

describe('<Pressable />', () => {
  it('should render as expected', () => {
    expectRendersMatchingSnapshot(
      'Pressable',
      () => (
        <Pressable>
          <View />
        </Pressable>
      ),
      () => {
        jest.dontMock('../Pressable');
      },
    );
  });
});
