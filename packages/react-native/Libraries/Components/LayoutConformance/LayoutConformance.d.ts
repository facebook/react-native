/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';

type LayoutConformanceProps = {
  /**
   * strict: Layout in accordance with W3C spec, even when breaking
   * compatibility: Layout with the same behavior as previous versions of React Native
   */
  mode: 'strict' | 'compatibility';
  children: React.ReactNode;
};

declare const experimental_LayoutConformance: React.ComponentType<LayoutConformanceProps>;

export default experimental_LayoutConformance;
