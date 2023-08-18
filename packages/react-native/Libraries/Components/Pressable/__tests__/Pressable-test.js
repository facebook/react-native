/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import {expectRendersMatchingSnapshot} from '../../../Utilities/ReactNativeTestTools';
import View from '../../View/View';
import Pressable from '../Pressable';
import * as React from 'react';

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

describe('<Pressable disabled={true} />', () => {
  it('should be disabled when disabled is true', () => {
    expectRendersMatchingSnapshot(
      'Pressable',
      () => (
        <Pressable disabled={true}>
          <View />
        </Pressable>
      ),
      () => {
        jest.dontMock('../Pressable');
      },
    );
  });
});

describe('<Pressable disabled={true} accessibilityState={{}} />', () => {
  it('should be disabled when disabled is true and accessibilityState is empty', () => {
    expectRendersMatchingSnapshot(
      'Pressable',
      () => (
        <Pressable disabled={true} accessibilityState={{}}>
          <View />
        </Pressable>
      ),
      () => {
        jest.dontMock('../Pressable');
      },
    );
  });
});

describe('<Pressable disabled={true} accessibilityState={{checked: true}} />', () => {
  it('should keep accessibilityState when disabled is true', () => {
    expectRendersMatchingSnapshot(
      'Pressable',
      () => (
        <Pressable disabled={true} accessibilityState={{checked: true}}>
          <View />
        </Pressable>
      ),
      () => {
        jest.dontMock('../Pressable');
      },
    );
  });
});

describe('<Pressable disabled={true} accessibilityState={{disabled: false}} />', () => {
  it('should overwrite accessibilityState with value of disabled prop', () => {
    expectRendersMatchingSnapshot(
      'Pressable',
      () => (
        <Pressable disabled={true} accessibilityState={{disabled: false}}>
          <View />
        </Pressable>
      ),
      () => {
        jest.dontMock('../Pressable');
      },
    );
  });
});
