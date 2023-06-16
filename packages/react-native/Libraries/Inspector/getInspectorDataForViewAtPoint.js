/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {TouchedViewDataAtPoint} from '../Renderer/shims/ReactNativeTypes';
import type {HostRef} from './findRenderers';

const findRenderers = require('./findRenderers');

const renderers = findRenderers();

export type {HostRef};
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
