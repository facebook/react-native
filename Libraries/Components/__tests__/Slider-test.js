/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import * as React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import Slider from '../Slider/Slider';

describe('<Slider />', () => {
  it('should render as expected', () => {
    expect(ReactTestRenderer.create(<Slider />)).toMatchSnapshot();
  });

  it('should set disabled as false', () => {
    // Slider component should set disabled prop as false by default
    expect(ReactTestRenderer.create(<Slider />)).toMatchSnapshot();
    expect(
      ReactTestRenderer.create(
        <Slider accessibilityState={{disabled: false}} />,
      ),
    ).toMatchSnapshot();
  });
  it('should set disabled as true', () => {
    expect(ReactTestRenderer.create(<Slider disabled />)).toMatchSnapshot();
    expect(
      ReactTestRenderer.create(
        <Slider accessibilityState={{disabled: true}} />,
      ),
    ).toMatchSnapshot();
  });
});
