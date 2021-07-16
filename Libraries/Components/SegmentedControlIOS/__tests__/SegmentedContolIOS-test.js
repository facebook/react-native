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
    expect(component.toTree().rendered.props.enabled).toBe(true);
    expect(component).toMatchSnapshot();
  });
  it('renders the segmented control with enabled', () => {
    const component = ReactTestRenderer.create(
      <SegmentedControlIOS enabled={true} />,
    );
    expect(component.toTree().rendered.props.enabled).toBe(true);
    expect(component).toMatchSnapshot();
  });
  it('renders the segmented control with enabled set to false', () => {
    const component = ReactTestRenderer.create(
      <SegmentedControlIOS enabled={false} />,
    );
    expect(component.toTree().rendered.props.enabled).toBe(false);
    expect(component).toMatchSnapshot();
  });
  it('renders the segmented control with values default value', () => {
    const component = ReactTestRenderer.create(<SegmentedControlIOS />);
    expect(component.toTree().rendered.props.values).toEqual([]);
    expect(component).toMatchSnapshot();
  });
  it('renders the segmented control with values', () => {
    const values = ['One', 'Two'];
    const component = ReactTestRenderer.create(
      <SegmentedControlIOS values={values} />,
    );
    expect(component.toTree().rendered.props.values).toBe(values);
    expect(component).toMatchSnapshot();
  });
});
