/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {InspectorData} from '../Renderer/shims/ReactNativeTypes';

const findRenderers = require('./findRenderers');

const renderers = findRenderers();

module.exports = function getInspectorDataForInstance(
  hostInstance: Object,
): InspectorData {
  for (const renderer of renderers) {
    if (renderer?.rendererConfig?.getInspectorDataForInstance != null) {
      const fiber = renderer.findFiberByHostInstance(hostInstance);

      const inspectorData =
        renderer.rendererConfig.getInspectorDataForInstance(fiber);

      if (inspectorData?.hierarchy?.length > 0) {
        return inspectorData;
      }
    }
  }

  return {
    hierarchy: [],
    props: {},
    selectedIndex: null,
    source: null,
  };
};
