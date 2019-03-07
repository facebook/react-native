/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import * as React from 'react';
import GlobalPerformanceLogger from 'GlobalPerformanceLogger';
import type {IPerformanceLogger} from 'createPerformanceLogger';

const PerformanceLoggerContext: React.Context<
  IPerformanceLogger,
> = React.createContext(GlobalPerformanceLogger);
export default PerformanceLoggerContext;
