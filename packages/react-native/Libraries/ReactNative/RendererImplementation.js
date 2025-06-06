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
    require('../Renderer/shims/ReactFabric').default.render(
      element,
      rootTag,
      null,
      useConcurrentRoot,
      {
        onCaughtError,
        onUncaughtError,
        onRecoverableError,
      },
    );
  } else {
    require('../Renderer/shims/ReactNative').default.render(
      element,
      rootTag,
      undefined,
      {
        onCaughtError,
        onUncaughtError,
        onRecoverableError,
      },
    );
  }
}

export function findHostInstance_DEPRECATED<TElementType: React.ElementType>(
  // $FlowFixMe[incompatible-call]
  componentOrHandle: ?(React.ElementRef<TElementType> | number),
): ?HostInstance {
  return require('../Renderer/shims/ReactNative').default.findHostInstance_DEPRECATED(
    // $FlowFixMe[incompatible-call]
    componentOrHandle,
  );
}

export function findNodeHandle<TElementType: React.ElementType>(
  // $FlowFixMe[incompatible-call]
  componentOrHandle: ?(React.ElementRef<TElementType> | number),
): ?number {
  return require('../Renderer/shims/ReactNative').default.findNodeHandle(
    // $FlowFixMe[incompatible-call]
    componentOrHandle,
  );
}

export function dispatchCommand(
  handle: HostInstance,
  command: string,
  args: Array<mixed>,
): void {
  if (global.RN$Bridgeless === true) {
    // Note: this function has the same implementation in the legacy and new renderer.
    // However, evaluating the old renderer comes with some side effects.
    return require('../Renderer/shims/ReactFabric').default.dispatchCommand(
      handle,
      command,
      args,
    );
  } else {
    return require('../Renderer/shims/ReactNative').default.dispatchCommand(
      handle,
      command,
      args,
    );
  }
}

export function sendAccessibilityEvent(
  handle: HostInstance,
  eventType: string,
): void {
  return require('../Renderer/shims/ReactNative').default.sendAccessibilityEvent(
    handle,
    eventType,
  );
}

/**
 * This method is used by AppRegistry to unmount a root when using the old
 * React Native renderer (Paper).
 */
export function unmountComponentAtNodeAndRemoveContainer(rootTag: RootTag) {
  // $FlowExpectedError[incompatible-type] rootTag is an opaque type so we can't really cast it as is.
  const rootTagAsNumber: number = rootTag;
  require('../Renderer/shims/ReactNative').default.unmountComponentAtNodeAndRemoveContainer(
    rootTagAsNumber,
  );
}

export function unstable_batchedUpdates<T>(
  fn: T => void,
  bookkeeping: T,
): void {
  // This doesn't actually do anything when batching updates for a Fabric root.
  return require('../Renderer/shims/ReactNative').default.unstable_batchedUpdates(
    fn,
    bookkeeping,
  );
}

export function isProfilingRenderer(): boolean {
  return Boolean(__DEV__);
}

export function isChildPublicInstance(
  parentInstance: HostInstance,
  childInstance: HostInstance,
): boolean {
  return require('../Renderer/shims/ReactNative').default.isChildPublicInstance(
    parentInstance,
    childInstance,
  );
}

export function getNodeFromInternalInstanceHandle(
  internalInstanceHandle: InternalInstanceHandle,
): ?Node {
  // This is only available in Fabric
  return require('../Renderer/shims/ReactFabric').default.getNodeFromInternalInstanceHandle(
    internalInstanceHandle,
  );
}

export function getPublicInstanceFromInternalInstanceHandle(
  internalInstanceHandle: InternalInstanceHandle,
): mixed /*PublicInstance | PublicTextInstance | null*/ {
  // This is only available in Fabric
  return require('../Renderer/shims/ReactFabric').default.getPublicInstanceFromInternalInstanceHandle(
    internalInstanceHandle,
  );
}

export function getPublicInstanceFromRootTag(
  rootTag: number,
): mixed /*PublicRootInstance | null*/ {
  // This is only available in Fabric
  return require('../Renderer/shims/ReactFabric').default.getPublicInstanceFromRootTag(
    rootTag,
  );
}
