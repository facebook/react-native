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

import * as React from 'react';

import Switch from '../Switch';
import View from '../../View/View';
import {expectRendersMatchingSnapshot} from '../../../Utilities/ReactNativeTestTools';

describe('<Switch />', () => {
  it('should render as expected', () => {
    expectRendersMatchingSnapshot(
      'Switch',
      () => (
        <Switch>
          <View />
        </Switch>
      ),
      () => {
        jest.dontMock('../Switch');
      },
    );
  });
});

describe('<Switch disabled={true} />', () => {
  it('should be disabled when disabled is true', () => {
    expectRendersMatchingSnapshot(
      'Switch',
      () => (
        <Switch disabled={true}>
          <View />
        </Switch>
      ),
      () => {
        jest.dontMock('../Switch');
      },
    );
  });
});

describe('<Switch disabled={true} accessibilityState={{}} />', () => {
  it('should be disabled when disabled is true and accessibilityState is empty', () => {
    expectRendersMatchingSnapshot(
      'Switch',
      () => (
        <Switch disabled={true} accessibilityState={{}}>
          <View />
        </Switch>
      ),
      () => {
        jest.dontMock('../Switch');
      },
    );
  });
});

describe('<Switch disabled={true} accessibilityState={{checked: true}} />', () => {
  it('should keep accessibilityState when disabled is true', () => {
    expectRendersMatchingSnapshot(
      'Switch',
      () => (
        <Switch disabled={true} accessibilityState={{checked: true}}>
          <View />
        </Switch>
      ),
      () => {
        jest.dontMock('../Switch');
      },
    );
  });
});

describe('<Switch disabled={true} accessibilityState={{disabled: false}} />', () => {
  it('should overwrite accessibilityState with value of disabled prop', () => {
    expectRendersMatchingSnapshot(
      'Switch',
      () => (
        <Switch disabled={true} accessibilityState={{disabled: false}}>
          <View />
        </Switch>
      ),
      () => {
        jest.dontMock('../Switch');
      },
    );
  });
});
