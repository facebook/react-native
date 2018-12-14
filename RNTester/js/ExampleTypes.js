/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type React from 'react';

export type Example = {
  title: string,
  /* $FlowFixMe(>=0.89.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.89 was deployed. To see the error, delete this comment
   * and run Flow. */
  render: () => ?React.Element<any>,
  description?: string,
  platform?: string,
};

export type ExampleModule = {
  title: string,
  description: string,
  examples: Array<Example>,
};
