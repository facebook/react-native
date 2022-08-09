/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 * @flow
 */

import * as React from 'react';
import TestRenderer from 'react-test-renderer';
import ShallowRenderer from 'react-shallow-renderer';

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
