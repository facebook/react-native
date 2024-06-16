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

import * as React from 'react';
import TestRenderer from 'react-test-renderer';

export const create = (Component: React.Element<any>): any => {
  return TestRenderer.create(Component);
};
