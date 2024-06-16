/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

import type {ReactTestRenderer} from 'react-test-renderer';

import * as React from 'react';
import ShallowRenderer from 'react-shallow-renderer';
import TestRenderer from 'react-test-renderer';

const renderer = new ShallowRenderer();

export const shallow = (Component: React.Element<any>): any => {
  const Wrapper = (): React.Element<any> => Component;

  return renderer.render(<Wrapper />);
};

export const shallowRender = (Component: React.Element<any>): any => {
  return renderer.render(Component);
};

export const create = async (
  Component: React.Element<any>,
): Promise<ReactTestRenderer> => {
  return TestRenderer.create(Component);
};
