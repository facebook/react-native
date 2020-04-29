/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 * @flow strict-local
 */

'use strict';

const React = require('react');
const View = require('../../Components/View/View');
const Modal = require('../Modal');

const render = require('../../../jest/renderer');

describe('<Modal />', () => {
  it('should render as <Modal> when mocked', () => {
    const instance = render.create(
      <Modal>
        <View />
      </Modal>,
    );
    expect(instance).toMatchSnapshot();
  });

  it('should shallow render as <Component> when mocked', () => {
    const output = render.shallow(
      <Modal>
        <View />
      </Modal>,
    );
    expect(output).toMatchSnapshot();
  });

  it('should shallow render as <Modal> when not mocked', () => {
    jest.dontMock('../Modal');

    const output = render.shallow(
      <Modal>
        <View />
      </Modal>,
    );
    expect(output).toMatchSnapshot();
  });

  it('should render as <RCTModalHostView> when not mocked', () => {
    jest.dontMock('../Modal');

    const instance = render.create(
      <Modal>
        <View />
      </Modal>,
    );
    expect(instance).toMatchSnapshot();
  });
});
