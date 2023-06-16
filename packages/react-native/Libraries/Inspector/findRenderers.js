/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {
  HostComponent,
  InspectorData,
} from '../Renderer/shims/ReactNativeTypes';

import invariant from 'invariant';
import * as React from 'react';

const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

export type HostRef = React.ElementRef<HostComponent<mixed>>;
export type ReactRenderer = {
  // Types for HostInstance and Fiber are private and defined in React
  findFiberByHostInstance: (hostInstance: mixed) => ?mixed,
  rendererConfig: {
    getInspectorDataForInstance: (fiber: ?mixed) => InspectorData,
    getInspectorDataForViewAtPoint: (
      inspectedView: ?HostRef,
      locationX: number,
      locationY: number,
      callback: Function,
    ) => void,
    ...
  },
};

function findRenderers(): $ReadOnlyArray<ReactRenderer> {
  const allRenderers = Array.from(hook.renderers.values());

  invariant(
    allRenderers.length >= 1,
    'Expected to find at least one React Native renderer on DevTools hook.',
  );

  return allRenderers;
}

module.exports = findRenderers;
