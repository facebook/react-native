/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import * as React from 'react';

export opaque type RootTag = number;

export const RootTagContext: React.Context<RootTag> =
  React.createContext<RootTag>(0);

if (__DEV__) {
  RootTagContext.displayName = 'RootTagContext';
}

/**
 * Intended to only be used by `AppContainer`.
 */
export function createRootTag(rootTag: number | RootTag): RootTag {
  return rootTag;
}
