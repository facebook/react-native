/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../../src/private/types/HostInstance';
import type {
  InternalInstanceHandle,
  Node,
} from '../Renderer/shims/ReactNativeTypes';

import {
  onCaughtError,
  onRecoverableError,
  onUncaughtError,
} from '../../src/private/renderer/errorhandling/ErrorHandlers';
import {type RootTag} from './RootTag';
import * as React from 'react';

let cachedFabricRender;
let cachedPaperRender;

export function renderElement({
  element,
  rootTag,
  useFabric,
  useConcurrentRoot,
}: {
  element: React.MixedElement,
  rootTag: number,
  useFabric: boolean,
  useConcurrentRoot: boolean,
}): void {
  if (useFabric) {
    if (cachedFabricRender == null) {
      cachedFabricRender = require('../Renderer/shims/ReactFabric').default
        .render;
    }

    cachedFabricRender(element, rootTag, null, useConcurrentRoot, {
      onCaughtError,
      onUncaughtError,
      onRecoverableError,
    });
  } else {
    if (cachedPaperRender == null) {
      cachedPaperRender = require('../Renderer/shims/ReactNative').default
        .render;
    }

    cachedPaperRender(element, rootTag, undefined, {
      onCaughtError,
      onUncaughtError,
      onRecoverableError,
    });
  }
}

let cachedFindHostInstance_DEPRECATED: ?<TElementType: React.ElementType>(
  componentOrHandle: ?(React.ElementRef<TElementType> | number),
) => ?HostInstance;

export function findHostInstance_DEPRECATED<TElementType: React.ElementType>(
  // $FlowFixMe[incompatible-type]
  componentOrHandle: ?(React.ElementRef<TElementType> | number),
): ?HostInstance {
  if (cachedFindHostInstance_DEPRECATED == null) {
    cachedFindHostInstance_DEPRECATED = require('../Renderer/shims/ReactNative')
      .default.findHostInstance_DEPRECATED;
  }

  return cachedFindHostInstance_DEPRECATED(
    // $FlowFixMe[incompatible-type]
    componentOrHandle,
  );
}

let cachedFindNodeHandle: ?<TElementType: React.ElementType>(
  componentOrHandle: ?(React.ElementRef<TElementType> | number),
) => ?number;

export function findNodeHandle<TElementType: React.ElementType>(
  // $FlowFixMe[incompatible-type]
  componentOrHandle: ?(React.ElementRef<TElementType> | number),
): ?number {
  if (cachedFindNodeHandle == null) {
    cachedFindNodeHandle = require('../Renderer/shims/ReactNative').default
      .findNodeHandle;
  }

  return cachedFindNodeHandle(
    // $FlowFixMe[incompatible-type]
    componentOrHandle,
  );
}

let cachedFabricDispatchCommand;
let cachedPaperDispatchCommand;

export function dispatchCommand(
  handle: HostInstance,
  command: string,
  args: Array<mixed>,
): void {
  if (global.RN$Bridgeless === true) {
    // Note: this function has the same implementation in the legacy and new renderer.
    // However, evaluating the old renderer comes with some side effects.
    if (cachedFabricDispatchCommand == null) {
      cachedFabricDispatchCommand = require('../Renderer/shims/ReactFabric')
        .default.dispatchCommand;
    }

    return cachedFabricDispatchCommand(handle, command, args);
  } else {
    if (cachedPaperDispatchCommand == null) {
      cachedPaperDispatchCommand = require('../Renderer/shims/ReactNative')
        .default.dispatchCommand;
    }

    return cachedPaperDispatchCommand(handle, command, args);
  }
}

let cachedSendAccessibilityEvent;

export function sendAccessibilityEvent(
  handle: HostInstance,
  eventType: string,
): void {
  if (cachedSendAccessibilityEvent == null) {
    cachedSendAccessibilityEvent = require('../Renderer/shims/ReactNative')
      .default.sendAccessibilityEvent;
  }

  return cachedSendAccessibilityEvent(handle, eventType);
}

let cachedUnmountComponentAtNodeAndRemoveContainer;

/**
 * This method is used by AppRegistry to unmount a root when using the old
 * React Native renderer (Paper).
 */
export function unmountComponentAtNodeAndRemoveContainer(rootTag: RootTag) {
  // $FlowExpectedError[incompatible-type] rootTag is an opaque type so we can't really cast it as is.
  const rootTagAsNumber: number = rootTag;
  if (cachedUnmountComponentAtNodeAndRemoveContainer == null) {
    cachedUnmountComponentAtNodeAndRemoveContainer =
      require('../Renderer/shims/ReactNative').default
        .unmountComponentAtNodeAndRemoveContainer;
  }

  cachedUnmountComponentAtNodeAndRemoveContainer(rootTagAsNumber);
}

let cachedUnstableBatchedUpdates: ?<T>(fn: (T) => void, bookkeeping: T) => void;

export function unstable_batchedUpdates<T>(
  fn: T => void,
  bookkeeping: T,
): void {
  if (cachedUnstableBatchedUpdates == null) {
    cachedUnstableBatchedUpdates = require('../Renderer/shims/ReactNative')
      .default.unstable_batchedUpdates;
  }

  // This doesn't actually do anything when batching updates for a Fabric root.
  return cachedUnstableBatchedUpdates(fn, bookkeeping);
}

export function isProfilingRenderer(): boolean {
  return Boolean(__DEV__);
}

let cachedIsChildPublicInstance;

export function isChildPublicInstance(
  parentInstance: HostInstance,
  childInstance: HostInstance,
): boolean {
  if (cachedIsChildPublicInstance == null) {
    cachedIsChildPublicInstance = require('../Renderer/shims/ReactNative')
      .default.isChildPublicInstance;
  }

  return cachedIsChildPublicInstance(parentInstance, childInstance);
}

let cachedGetNodeFromInternalInstanceHandle;

export function getNodeFromInternalInstanceHandle(
  internalInstanceHandle: InternalInstanceHandle,
): ?Node {
  if (cachedGetNodeFromInternalInstanceHandle == null) {
    cachedGetNodeFromInternalInstanceHandle =
      require('../Renderer/shims/ReactFabric').default
        .getNodeFromInternalInstanceHandle;
  }

  // This is only available in Fabric
  return cachedGetNodeFromInternalInstanceHandle(internalInstanceHandle);
}

let cachedGetPublicInstanceFromInternalInstanceHandle;

export function getPublicInstanceFromInternalInstanceHandle(
  internalInstanceHandle: InternalInstanceHandle,
): mixed /*PublicInstance | PublicTextInstance | null*/ {
  // This is only available in Fabric
  if (cachedGetPublicInstanceFromInternalInstanceHandle == null) {
    cachedGetPublicInstanceFromInternalInstanceHandle =
      require('../Renderer/shims/ReactFabric').default
        .getPublicInstanceFromInternalInstanceHandle;
  }
  return cachedGetPublicInstanceFromInternalInstanceHandle(
    internalInstanceHandle,
  );
}

let cachedGetPublicInstanceFromRootTag;

export function getPublicInstanceFromRootTag(
  rootTag: number,
): mixed /*PublicRootInstance | null*/ {
  // This is only available in Fabric
  if (cachedGetPublicInstanceFromRootTag == null) {
    cachedGetPublicInstanceFromRootTag =
      require('../Renderer/shims/ReactFabric').default
        .getPublicInstanceFromRootTag;
  }

  return cachedGetPublicInstanceFromRootTag(rootTag);
}
