/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {AbstractComponent} from 'react';

import * as React from 'react';

type NoopComponent = AbstractComponent<{children: React.Node}>;

const cache: Map<
  string, // displayName
  NoopComponent, // ComponentWithDisplayName
> = new Map();

export default function getCachedComponentWithDisplayName(
  displayName: string,
): NoopComponent {
  let ComponentWithDisplayName = cache.get(displayName);

  if (!ComponentWithDisplayName) {
    ComponentWithDisplayName = ({children}: {children: React.Node}) => children;
    // $FlowFixMe[prop-missing]
    ComponentWithDisplayName.displayName = displayName;
    cache.set(displayName, ComponentWithDisplayName);
  }

  return ComponentWithDisplayName;
}
