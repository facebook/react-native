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

const ShallowRenderer = require('react-shallow-renderer');
const TestRenderer = require('react-test-renderer');

/* $FlowFixMe(>=0.125.1 site=react_native_fb) This comment suppresses an error
 * found when Flow v0.125.1 was deployed. To see the error, delete this comment
 * and run Flow. */
const renderer = new ShallowRenderer();

export const shallow = (Component: React.Element<any>): any => {
  const Wrapper = (): React.Element<any> => Component;

  return renderer.render(<Wrapper />);
};

export const shallowRender = (Component: React.Element<any>): any => {
  return renderer.render(Component);
};

export const create = (Component: React.Element<any>): any => {
  return TestRenderer.create(Component);
};
