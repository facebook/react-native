/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';

/**
 * YellowBox has been replaced with LogBox.
 * @see LogBox
 * @deprecated
 */
export const YellowBox: React.ComponentClass<any, any> & {
  ignoreWarnings: (warnings: string[]) => void;
};
