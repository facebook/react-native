/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import typeof ReactFabricType from '../../Renderer/shims/ReactFabric';
import type {
  InternalInstanceHandle,
  ViewConfig,
} from '../../Renderer/shims/ReactNativeTypes';
import type ReactFabricHostComponentType from './ReactFabricHostComponent';

// Lazy loaded to avoid evaluating the module when using the legacy renderer.
let ReactFabricHostComponent: Class<ReactFabricHostComponentType>;
// Lazy loaded to avoid evaluating the module when using the legacy renderer.
let ReactFabric: ReactFabricType;

export function createPublicInstance(
  tag: number,
  viewConfig: ViewConfig,
  internalInstanceHandle: InternalInstanceHandle,
): ReactFabricHostComponentType {
  if (ReactFabricHostComponent == null) {
    ReactFabricHostComponent = require('./ReactFabricHostComponent').default;
  }
  return new ReactFabricHostComponent(tag, viewConfig, internalInstanceHandle);
}

export function createPublicTextInstance(internalInstanceHandle: mixed): {} {
  // React will call this method to create text instances but we'll return an
  // empty object for now. These instances are only created lazily when
  // traversing the tree, and that's not enabled yet.
  return {};
}

export function getNativeTagFromPublicInstance(
  publicInstance: ReactFabricHostComponentType,
): number {
  return publicInstance.__nativeTag;
}

export function getNodeFromPublicInstance(
  publicInstance: ReactFabricHostComponentType,
): mixed {
  // Avoid loading ReactFabric if using an instance from the legacy renderer.
  if (publicInstance.__internalInstanceHandle == null) {
    return null;
  }

  if (ReactFabric == null) {
    ReactFabric = require('../../Renderer/shims/ReactFabric');
  }

  return ReactFabric.getNodeFromInternalInstanceHandle(
    publicInstance.__internalInstanceHandle,
  );
}
