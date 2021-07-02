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

const React = require('react');
const ReactTestRenderer = require('react-test-renderer');

const SegmentedControlIOS = require('../SegmentedControlIOS.ios');

describe('SegmentedControlIOS', () => {
  it('renders the segmented control', () => {
    const component = ReactTestRenderer.create(<SegmentedControlIOS />);
    expect(component).not.toBeNull();
  });
  it('renders the segmented control with enabled default value', () => {
    const component = ReactTestRenderer.create(<SegmentedControlIOS />);
    expect(component.toTree().props.enabled).toBe(true);
  });
  it('renders the segmented control with enabled', () => {
    const component = ReactTestRenderer.create(
      <SegmentedControlIOS enabled={true} />,
    );
    expect(component.toTree().props.enabled).toBe(true);
  });
  it('renders the segmented control with enabled set to false', () => {
    const component = ReactTestRenderer.create(
      <SegmentedControlIOS enabled={false} />,
    );
    expect(component.toTree().props.enabled).toBe(false);
  });
  it('renders the segmented control with values default value', () => {
    const component = ReactTestRenderer.create(<SegmentedControlIOS />);
    expect(component.toTree().props.values).toEqual([]);
  });
  it('renders the segmented control with values', () => {
    const values = ['One', 'Two'];
    const component = ReactTestRenderer.create(
      <SegmentedControlIOS values={values} />,
    );
    expect(component.toTree().props.values).toBe(values);
  });
});
