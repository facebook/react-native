/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

import Text from '../../../Text/Text';
import View from '../../View/View';
import TouchableHighlight from '../TouchableHighlight';
import * as React from 'react';

const render = require('../../../../jest/renderer');

describe('TouchableHighlight', () => {
  test('renders correctly', () => {
    const instance = render.create(
      <TouchableHighlight style={{}}>
        <Text>Touchable</Text>
      </TouchableHighlight>,
    );

    expect(instance.toJSON()).toMatchSnapshot();
  });

  test('has displayName', () => {
    expect(TouchableHighlight.displayName).toEqual('TouchableHighlight');
  });
});

describe('TouchableHighlight with disabled state', () => {
  test('should be disabled when disabled is true', () => {
    expect(
      render.create(
        <TouchableHighlight disabled={true}>
          <View />
        </TouchableHighlight>,
      ),
    ).toMatchSnapshot();
  });

  test('should be disabled when disabled is true and accessibilityState is empty', () => {
    expect(
      render.create(
        <TouchableHighlight disabled={true} accessibilityState={{}}>
          <View />
        </TouchableHighlight>,
      ),
    ).toMatchSnapshot();
  });

  test('should keep accessibilityState when disabled is true', () => {
    expect(
      render.create(
        <TouchableHighlight
          disabled={true}
          accessibilityState={{checked: true}}>
          <View />
        </TouchableHighlight>,
      ),
    ).toMatchSnapshot();
  });

  test('should overwrite accessibilityState with value of disabled prop', () => {
    expect(
      render.create(
        <TouchableHighlight
          disabled={true}
          accessibilityState={{disabled: false}}>
          <View />
        </TouchableHighlight>,
      ),
    ).toMatchSnapshot();
  });

  test('should disable button when accessibilityState is disabled', () => {
    expect(
      render.create(
        <TouchableHighlight accessibilityState={{disabled: true}}>
          <View />
        </TouchableHighlight>,
      ),
    ).toMatchSnapshot();
  });
});
