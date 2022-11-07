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
  TouchedViewDataAtPoint,
} from '../Renderer/shims/ReactNativeTypes';

const invariant = require('invariant');
const React = require('react');

export type HostRef = React.ElementRef<HostComponent<mixed>>;
export type ReactRenderer = {
  rendererConfig: {
    getInspectorDataForViewAtPoint: (
      inspectedView: ?HostRef,
      locationX: number,
      locationY: number,
      callback: Function,
    ) => void,
    ...
  },
};

const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
const renderers = findRenderers();

function findRenderers(): $ReadOnlyArray<ReactRenderer> {
  const allRenderers = Array.from(hook.renderers.values());
  invariant(
    allRenderers.length >= 1,
    'Expected to find at least one React Native renderer on DevTools hook.',
  );
  return allRenderers;
}

module.exports = function getInspectorDataForViewAtPoint(
  inspectedView: ?HostRef,
  locationX: number,
  locationY: number,
  callback: (viewData: TouchedViewDataAtPoint) => boolean,
) {
  let shouldBreak = false;
  // Check all renderers for inspector data.
  for (let i = 0; i < renderers.length; i++) {
    if (shouldBreak) {
      break;
    }
    const renderer = renderers[i];
    if (renderer?.rendererConfig?.getInspectorDataForViewAtPoint != null) {
      renderer.rendererConfig.getInspectorDataForViewAtPoint(
        inspectedView,
        locationX,
        locationY,
        viewData => {
          // Only return with non-empty view data since only one renderer will have this view.
          if (viewData && viewData.hierarchy.length > 0) {
            shouldBreak = callback(viewData);
          }
        },
      );
    }
  }
};
