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

describe('TouchableHighlight with disabled state', () => {
  it('should be disabled when disabled is true', () => {
    expect(
      ReactTestRenderer.create(
        <TouchableHighlight disabled={true}>
          <View />
        </TouchableHighlight>,
      ),
    ).toMatchSnapshot();
  });

  it('should be disabled when disabled is true and accessibilityState is empty', () => {
    expect(
      ReactTestRenderer.create(
        <TouchableHighlight disabled={true} accessibilityState={{}}>
          <View />
        </TouchableHighlight>,
      ),
    ).toMatchSnapshot();
  });

  it('should keep accessibilityState when disabled is true', () => {
    expect(
      ReactTestRenderer.create(
        <TouchableHighlight
          disabled={true}
          accessibilityState={{checked: true}}>
          <View />
        </TouchableHighlight>,
      ),
    ).toMatchSnapshot();
  });

  it('should overwrite accessibilityState with value of disabled prop', () => {
    expect(
      ReactTestRenderer.create(
        <TouchableHighlight
          disabled={true}
          accessibilityState={{disabled: false}}>
          <View />
        </TouchableHighlight>,
      ),
    ).toMatchSnapshot();
  });

  it('should disable button when accessibilityState is disabled', () => {
    expect(
      ReactTestRenderer.create(
        <TouchableHighlight accessibilityState={{disabled: true}}>
          <View />
        </TouchableHighlight>,
      ),
    ).toMatchSnapshot();
  });
});
