/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Button from '../Button';
import * as React from 'react';
import ReactTestRenderer from 'react-test-renderer';

describe('<Button />', () => {
  it('should render as expected', () => {
    expect(ReactTestRenderer.create(<Button title="Test Button" />)).toMatchSnapshot();
  });

  it('should be disabled and it should set accessibilityState to disabled when disabled={true}', () => {
    expect(
      ReactTestRenderer.create(<Button title="Test Button" disabled={true} />)
    ).toMatchSnapshot();
  });

  it('should be disabled when disabled={true} and accessibilityState={{disabled: true}}', () => {
    expect(
      ReactTestRenderer.create(<Button title="Test Button" disabled={true} accessibilityState={{disabled: true}} />)
    ).toMatchSnapshot();
  });

  it('should be disabled when disabled is empty and accessibilityState={{disabled: true}}', () => {
    expect(
      ReactTestRenderer.create(<Button title="Test Button" accessibilityState={{disabled: true}} />)
    ).toMatchSnapshot();
  });

  it('should overwrite accessibilityState with value of disabled prop', () => {
    expect(ReactTestRenderer.create(<Button title="Test Button" disabled={true} accessibilityState={{disabled: false}} />)
    ).toMatchSnapshot();
  });

  it('should not be disabled when disabled={false} and accessibilityState={{disabled: true}}', () => {
    expect(ReactTestRenderer.create(<Button title="Test Button" disabled={false} accessibilityState={{disabled: true}} />)
    ).toMatchSnapshot();
  });

  it('should not be disabled when disabled={false} and accessibilityState={{disabled: false}}', () => {
    expect(ReactTestRenderer.create( <Button title="Test Button" disabled={false} accessibilityState={{disabled: false}} />)
    ).toMatchSnapshot();
  });

  it('should be set importantForAccessibility={no-hide-descendants} when importantForAccessibility={no-hide-descendants}', () => {
    expect(ReactTestRenderer.create( <Button title="Test Button" importantForAccessibility={'no-hide-descendants'} />)
    ).toMatchSnapshot();
  });

  it('should be set importantForAccessibility={no-hide-descendants} when importantForAccessibility={no}', () => {
    expect(ReactTestRenderer.create( <Button title="Test Button" importantForAccessibility={'no'} />)
    ).toMatchSnapshot();
  });
});
