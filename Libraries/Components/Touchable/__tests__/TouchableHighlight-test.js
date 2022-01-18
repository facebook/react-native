/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

import * as React from 'react';
import Text from '../../../Text/Text';
import View from '../../View/View';
import TouchableHighlight from '../TouchableHighlight';

const render = require('../../../../jest/renderer');

describe('TouchableHighlight', () => {
  it('renders correctly', () => {
    const instance = render.create(
      <TouchableHighlight style={{}}>
        <Text>Touchable</Text>
      </TouchableHighlight>,
    );

    expect(instance.toJSON()).toMatchSnapshot();
  });

  it('has displayName', () => {
    expect(TouchableHighlight.displayName).toEqual('TouchableHighlight');
  });
});

describe('TouchableHighlight with disabled state', () => {
  it('should be disabled when disabled is true', () => {
    expect(
      render.create(
        <TouchableHighlight disabled={true}>
          <View />
        </TouchableHighlight>,
      ),
    ).toMatchSnapshot();
  });

  it('should be disabled when disabled is true and accessibilityState is empty', () => {
    expect(
      render.create(
        <TouchableHighlight disabled={true} accessibilityState={{}}>
          <View />
        </TouchableHighlight>,
      ),
    ).toMatchSnapshot();
  });

  it('should keep accessibilityState when disabled is true', () => {
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

  it('should overwrite accessibilityState with value of disabled prop', () => {
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

  it('should disable button when accessibilityState is disabled', () => {
    expect(
      render.create(
        <TouchableHighlight accessibilityState={{disabled: true}}>
          <View />
        </TouchableHighlight>,
      ),
    ).toMatchSnapshot();
  });
});
