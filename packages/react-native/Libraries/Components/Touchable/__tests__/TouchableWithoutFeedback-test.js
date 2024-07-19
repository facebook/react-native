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

import {create} from '../../../../jest/renderer';
import Text from '../../../Text/Text';
import View from '../../View/View';
import TouchableWithoutFeedback from '../TouchableWithoutFeedback';
import * as React from 'react';

describe('TouchableWithoutFeedback', () => {
  it('renders correctly', async () => {
    const instance = await create(
      <TouchableWithoutFeedback style={{}}>
        <Text>Touchable</Text>
      </TouchableWithoutFeedback>,
    );

    expect(instance.toJSON()).toMatchSnapshot();
  });
});

describe('TouchableWithoutFeedback with disabled state', () => {
  it('should be disabled when disabled is true', async () => {
    expect(
      await create(
        <TouchableWithoutFeedback disabled={true}>
          <View />
        </TouchableWithoutFeedback>,
      ),
    ).toMatchSnapshot();
  });

  it('should be disabled when disabled is true and accessibilityState is empty', async () => {
    expect(
      await create(
        <TouchableWithoutFeedback disabled={true} accessibilityState={{}}>
          <View />
        </TouchableWithoutFeedback>,
      ),
    ).toMatchSnapshot();
  });

  it('should keep accessibilityState when disabled is true', async () => {
    expect(
      await create(
        <TouchableWithoutFeedback
          disabled={true}
          accessibilityState={{checked: true}}>
          <View />
        </TouchableWithoutFeedback>,
      ),
    ).toMatchSnapshot();
  });

  it('should overwrite accessibilityState with value of disabled prop', async () => {
    expect(
      await create(
        <TouchableWithoutFeedback
          disabled={true}
          accessibilityState={{disabled: false}}>
          <View />
        </TouchableWithoutFeedback>,
      ),
    ).toMatchSnapshot();
  });

  it('should disable button when accessibilityState is disabled', async () => {
    expect(
      await create(
        <TouchableWithoutFeedback accessibilityState={{disabled: true}}>
          <View />
        </TouchableWithoutFeedback>,
      ),
    ).toMatchSnapshot();
  });
});
