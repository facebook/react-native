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
import typeof ReactFabricType from '../Renderer/shims/ReactFabric';

import {
  onCaughtError,
  onRecoverableError,
  onUncaughtError,
} from '../../src/private/renderer/errorhandling/ErrorHandlers';
import * as React from 'react';

let cachedFabricRenderer;

function getFabricRenderer(): ReactFabricType {
  if (cachedFabricRenderer == null) {
    cachedFabricRenderer = require('../Renderer/shims/ReactFabric').default;
  }
  return cachedFabricRenderer;
}

const getMethod: <MethodName extends keyof ReactFabricType>(
  () => ReactFabricType,
  MethodName,
) => ReactFabricType[MethodName] = (getRenderer, methodName) => {
  let cachedImpl;

  // $FlowExpectedError[incompatible-type]
  return function (arg1, arg2, arg3, arg4, arg5, arg6) {
    if (cachedImpl == null) {
      // $FlowExpectedError[prop-missing]
      // $FlowExpectedError[invalid-computed-prop]
      cachedImpl = getRenderer()[methodName];
    }

    // $FlowExpectedError[extra-arg]
    return cachedImpl(arg1, arg2, arg3, arg4, arg5);
  };
};

function getFabricMethod<MethodName extends keyof ReactFabricType>(
  methodName: MethodName,
): ReactFabricType[MethodName] {
  return getMethod(getFabricRenderer, methodName);
}

let cachedFabricRender;

export function renderElement({
  element,
  rootTag,
}: {
  element: React.MixedElement,
  rootTag: number,
}): void {
  if (cachedFabricRender == null) {
    cachedFabricRender = getFabricRenderer().render;
  }

  cachedFabricRender(
    element,
    rootTag,
    /* callback */ null,
    /* useConcurrentRoot */ true,
    {
      onCaughtError,
      onUncaughtError,
      onRecoverableError,
    },
  );
}

let cachedFabricDispatchCommand;

export function dispatchCommand(
  handle: HostInstance,
  command: string,
  args: Array<unknown>,
): void {
  if (cachedFabricDispatchCommand == null) {
    cachedFabricDispatchCommand = getFabricRenderer().dispatchCommand;
  }

  return cachedFabricDispatchCommand(handle, command, args);
}

export const findHostInstance_DEPRECATED: <
  TElementType extends React.ElementType,
>(
  // $FlowExpectedError[incompatible-type]
  componentOrHandle: ?(React.ElementRef<TElementType> | number),
) => ?HostInstance = getFabricMethod('findHostInstance_DEPRECATED');

export const findNodeHandle: <TElementType extends React.ElementType>(
  // $FlowExpectedError[incompatible-type]
  componentOrHandle: ?(React.ElementRef<TElementType> | number),
) => ?number = getFabricMethod('findNodeHandle');

export const sendAccessibilityEvent: ReactFabricType['sendAccessibilityEvent'] =
  getFabricMethod('sendAccessibilityEvent');

export function unstable_batchedUpdates<T>(
  fn: (bookkeeping: T) => void,
  bookkeeping: T,
): void {
  fn(bookkeeping);
}

export const isChildPublicInstance: ReactFabricType['isChildPublicInstance'] =
  getFabricMethod('isChildPublicInstance');

export const getNodeFromInternalInstanceHandle: ReactFabricType['getNodeFromInternalInstanceHandle'] =
  getFabricMethod('getNodeFromInternalInstanceHandle');

export const getPublicInstanceFromInternalInstanceHandle: ReactFabricType['getPublicInstanceFromInternalInstanceHandle'] =
  getFabricMethod('getPublicInstanceFromInternalInstanceHandle');

export const getPublicInstanceFromRootTag: ReactFabricType['getPublicInstanceFromRootTag'] =
  getFabricMethod('getPublicInstanceFromRootTag');

export function isProfilingRenderer(): boolean {
  return Boolean(__DEV__);
}
