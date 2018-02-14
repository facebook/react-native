/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ExampleTypes
 * @flow
 */
'use strict';

/* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This comment
 * suppresses an error when upgrading Flow's support for React. To see the
 * error delete this comment and run Flow. */
import type React from 'react';

export type Example = {
  title: string,
  render: () => ?React.Element<any>,
  description?: string,
  platform?: string,
};

export type ExampleModule = {
  title: string,
  description: string,
  examples: Array<Example>,
};
