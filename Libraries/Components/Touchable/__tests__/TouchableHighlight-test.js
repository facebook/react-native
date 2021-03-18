/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

import * as React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import Text from '../../../Text/Text';
import View from '../../View/View';
import TouchableHighlight from '../TouchableHighlight';
import {expectRendersMatchingSnapshot} from '../../../Utilities/ReactNativeTestTools';

describe('TouchableHighlight', () => {
  it('renders correctly', () => {
    const instance = ReactTestRenderer.create(
      <TouchableHighlight style={{}}>
        <Text>Touchable</Text>
      </TouchableHighlight>,
    );

    expect(instance.toJSON()).toMatchSnapshot();
  });
});

describe('<TouchableHighlight disabled={true} />', () => {
  it('should be disabled when disabled is true', () => {
    expectRendersMatchingSnapshot(
      'TouchableHighlight',
      () => (
        <TouchableHighlight disabled={true}>
          <View />
        </TouchableHighlight>
      ),
      () => {
        jest.dontMock('../TouchableHighlight');
      },
    );
  });
});

describe('<TouchableHighlight disabled={true} accessibilityState={{}} />', () => {
  it('should be disabled when disabled is true and accessibilityState is empty', () => {
    expectRendersMatchingSnapshot(
      'TouchableHighlight',
      () => (
        <TouchableHighlight disabled={true} accessibilityState={{}}>
          <View />
        </TouchableHighlight>
      ),
      () => {
        jest.dontMock('../TouchableHighlight');
      },
    );
  });
});

describe('<TouchableHighlight disabled={true} accessibilityState={{checked: true}} />', () => {
  it('should keep accessibilityState when disabled is true', () => {
    expectRendersMatchingSnapshot(
      'TouchableHighlight',
      () => (
        <TouchableHighlight
          disabled={true}
          accessibilityState={{checked: true}}>
          <View />
        </TouchableHighlight>
      ),
      () => {
        jest.dontMock('../TouchableHighlight');
      },
    );
  });
});

describe('<TouchableHighlight disabled={true} accessibilityState={{disabled: false}} />', () => {
  it('should overwrite accessibilityState with value of disabled prop', () => {
    expectRendersMatchingSnapshot(
      'TouchableHighlight',
      () => (
        <TouchableHighlight
          disabled={true}
          accessibilityState={{disabled: false}}>
          <View />
        </TouchableHighlight>
      ),
      () => {
        jest.dontMock('../TouchableHighlight');
      },
    );
  });
});

describe('<TouchableHighlight disabled={undefined} accessibilityState={{disabled: true}} />', () => {
  it('should disable button when accessibilityState is disabled', () => {
    expectRendersMatchingSnapshot(
      'TouchableHighlight',
      () => (
        <TouchableHighlight accessibilityState={{disabled: true}}>
          <View />
        </TouchableHighlight>
      ),
      () => {
        jest.dontMock('../TouchableHighlight');
      },
    );
  });
});
