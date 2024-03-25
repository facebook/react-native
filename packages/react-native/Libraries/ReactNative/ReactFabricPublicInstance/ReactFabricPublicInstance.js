/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

/**
 * This module is meant to be used by the React renderers to create public
 * instances and get some data from them (like their instance handle / fiber).
 */

import type ReactNativeElement from '../../../src/private/webapis/dom/nodes/ReactNativeElement';
import type ReadOnlyText from '../../../src/private/webapis/dom/nodes/ReadOnlyText';
import typeof ReactFabricType from '../../Renderer/shims/ReactFabric';
import type {
  InternalInstanceHandle,
  Node,
  ViewConfig,
} from '../../Renderer/shims/ReactNativeTypes';
import type ReactFabricHostComponent from './ReactFabricHostComponent';

import * as ReactNativeFeatureFlags from '../../../src/private/featureflags/ReactNativeFeatureFlags';

// Lazy loaded to avoid evaluating the module when using the legacy renderer.
let PublicInstanceClass:
  | Class<ReactFabricHostComponent>
  | Class<ReactNativeElement>;
let ReadOnlyTextClass: Class<ReadOnlyText>;

// Lazy loaded to avoid evaluating the module when using the legacy renderer.
let ReactFabric: ReactFabricType;

export function createPublicInstance(
  tag: number,
  viewConfig: ViewConfig,
  internalInstanceHandle: InternalInstanceHandle,
): ReactFabricHostComponent | ReactNativeElement {
  if (PublicInstanceClass == null) {
    // We don't use inline requires in react-native, so this forces lazy loading
    // the right module to avoid eagerly loading both.
    if (ReactNativeFeatureFlags.enableAccessToHostTreeInFabric()) {
      PublicInstanceClass =
        require('../../../src/private/webapis/dom/nodes/ReactNativeElement').default;
    } else {
      PublicInstanceClass = require('./ReactFabricHostComponent').default;
    }
  }

  return new PublicInstanceClass(tag, viewConfig, internalInstanceHandle);
}

export function createPublicTextInstance(
  internalInstanceHandle: InternalInstanceHandle,
): ReadOnlyText {
  if (ReadOnlyTextClass == null) {
    ReadOnlyTextClass =
      require('../../../src/private/webapis/dom/nodes/ReadOnlyText').default;
  }

  return new ReadOnlyTextClass(internalInstanceHandle);
}

export function getNativeTagFromPublicInstance(
  publicInstance: ReactFabricHostComponent | ReactNativeElement,
): number {
  return publicInstance.__nativeTag;
}

export function getNodeFromPublicInstance(
  publicInstance: ReactFabricHostComponent | ReactNativeElement,
): ?Node {
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

export function getInternalInstanceHandleFromPublicInstance(
  publicInstance: ReactFabricHostComponent | ReactNativeElement,
): InternalInstanceHandle {
  // TODO(T174762768): Remove this once OSS versions of renderers will be synced.
  // $FlowExpectedError[prop-missing] Keeping this for backwards-compatibility with the renderers versions in open source.
  if (publicInstance._internalInstanceHandle != null) {
    // $FlowExpectedError[incompatible-return] Keeping this for backwards-compatibility with the renderers versions in open source.
    return publicInstance._internalInstanceHandle;
  }

  return publicInstance.__internalInstanceHandle;
}
