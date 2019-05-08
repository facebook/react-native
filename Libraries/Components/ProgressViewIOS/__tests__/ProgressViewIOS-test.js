/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 * @flow
 */

'use strict';

const React = require('react');
const ProgressViewIOS = require('../ProgressViewIOS');

const render = require('../../../../jest/renderer');

describe('<ProgressViewIOS />', () => {
  it('should render as <RCTProgressView> when mocked', () => {
    const instance = render.create(<ProgressViewIOS progress={90} />);
    expect(instance).toMatchSnapshot();
  });

  it('should shallow render as <ForwardRef(ProgressViewIOS)> when mocked', () => {
    const output = render.shallow(<ProgressViewIOS progress={90} />);
    expect(output).toMatchSnapshot();
  });

  it('should shallow render as <ForwardRef(ProgressViewIOS)> when not mocked', () => {
    jest.dontMock('../ProgressViewIOS');

    const output = render.shallow(<ProgressViewIOS progress={90} />);
    expect(output).toMatchSnapshot();
  });

  it('should render as <RCTProgressView> when not mocked', () => {
    jest.dontMock('../ProgressViewIOS');

    const instance = render.create(<ProgressViewIOS progress={90} />);
    expect(instance).toMatchSnapshot();
  });
});
