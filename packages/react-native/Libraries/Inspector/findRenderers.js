/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type ReactFabricHostComponent from '../ReactNative/ReactFabricPublicInstance/ReactFabricHostComponent';
import type {
  HostComponent,
  InspectorData,
} from '../Renderer/shims/ReactNativeTypes';

const invariant = require('invariant');
const React = require('react');

const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

export type HostRef = React.ElementRef<HostComponent<mixed>>;
export type ReactRenderer = {
  findFiberByHostInstance: <T>(
    hostInstance: ReactFabricHostComponent | HostComponent<T>,
  ) => ?Object,
  rendererConfig: {
    getInspectorDataForInstance: (fiber: ?Object) => InspectorData,
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
