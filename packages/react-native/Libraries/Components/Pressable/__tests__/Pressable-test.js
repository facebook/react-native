/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {PlatformColor} from '../../../StyleSheet/PlatformColorValueTypes';
import Platform from '../../../Utilities/Platform';
import {expectRendersMatchingSnapshot} from '../../../Utilities/ReactNativeTestTools';
import View from '../../View/View';
import Pressable from '../Pressable';
import * as React from 'react';

describe('<Pressable />', () => {
  it('should render as expected', async () => {
    await expectRendersMatchingSnapshot(
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
  it('should be disabled when disabled is true', async () => {
    await expectRendersMatchingSnapshot(
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
  it('should be disabled when disabled is true and accessibilityState is empty', async () => {
    await expectRendersMatchingSnapshot(
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
  it('should keep accessibilityState when disabled is true', async () => {
    await expectRendersMatchingSnapshot(
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
  it('should overwrite accessibilityState with value of disabled prop', async () => {
    await expectRendersMatchingSnapshot(
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

describe('<Pressable android_ripple /> on Android', () => {
  let originalOS: string;

  beforeEach(() => {
    originalOS = Platform.OS;
    /* $FlowFixMe[incompatible-type] */
    Platform.OS = 'android';
  });

  afterEach(() => {
    /* $FlowFixMe[incompatible-type] */
    Platform.OS = originalOS;
  });

  it('should set nativeBackgroundAndroid with numeric color and alpha', async () => {
    await expectRendersMatchingSnapshot(
      'Pressable',
      () => (
        <Pressable android_ripple={{color: '#FF0000', alpha: 0.5}}>
          <View />
        </Pressable>
      ),
      () => {
        jest.dontMock('../Pressable');
      },
    );
  });

  it('should set nativeBackgroundAndroid with PlatformColor and alpha', async () => {
    await expectRendersMatchingSnapshot(
      'Pressable',
      () => (
        <Pressable
          android_ripple={{
            color: PlatformColor('?attr/colorAccent'),
            alpha: 0.3,
          }}>
          <View />
        </Pressable>
      ),
      () => {
        jest.dontMock('../Pressable');
      },
    );
  });

  it('should not crash with an unresolvable PlatformColor', async () => {
    await expectRendersMatchingSnapshot(
      'Pressable',
      () => (
        <Pressable
          android_ripple={{
            color: PlatformColor('?attr/doesNotExist'),
            alpha: 0.5,
          }}>
          <View />
        </Pressable>
      ),
      () => {
        jest.dontMock('../Pressable');
      },
    );
  });
});
