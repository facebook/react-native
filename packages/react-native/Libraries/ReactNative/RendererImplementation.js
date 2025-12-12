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
import typeof ReactNativeType from '../Renderer/shims/ReactNative';
import type {RootTag} from './RootTag';

import {
  onCaughtError,
  onRecoverableError,
  onUncaughtError,
} from '../../src/private/renderer/errorhandling/ErrorHandlers';
import * as React from 'react';

let cachedFabricRenderer;
let cachedPaperRenderer;

function getFabricRenderer(): ReactFabricType {
  if (cachedFabricRenderer == null) {
    cachedFabricRenderer = require('../Renderer/shims/ReactFabric').default;
  }
  return cachedFabricRenderer;
}

function getPaperRenderer(): ReactNativeType {
  if (cachedPaperRenderer == null) {
    cachedPaperRenderer = require('../Renderer/shims/ReactNative').default;
  }
  return cachedPaperRenderer;
}

const getMethod: (<MethodName: $Keys<ReactFabricType>>(
  () => ReactFabricType,
  MethodName,
) => ReactFabricType[MethodName]) &
  (<MethodName: $Keys<ReactNativeType>>(
    () => ReactNativeType,
    MethodName,
  ) => ReactNativeType[MethodName]) = (getRenderer, methodName) => {
  let cachedImpl;

  // $FlowExpectedError[incompatible-type]
  return function (arg1, arg2, arg3, arg4, arg5, arg6) {
    if (cachedImpl == null) {
      // $FlowExpectedError[prop-missing]
      cachedImpl = getRenderer()[methodName];
    }

    // $FlowExpectedError[extra-arg]
    return cachedImpl(arg1, arg2, arg3, arg4, arg5);
  };
};

function getFabricMethod<MethodName: $Keys<ReactFabricType>>(
  methodName: MethodName,
): ReactFabricType[MethodName] {
  return getMethod(getFabricRenderer, methodName);
}

function getPaperMethod<MethodName: $Keys<ReactNativeType>>(
  methodName: MethodName,
): ReactNativeType[MethodName] {
  return getMethod(getPaperRenderer, methodName);
}

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
      cachedFabricRender = getFabricRenderer().render;
    }

    cachedFabricRender(element, rootTag, null, useConcurrentRoot, {
      onCaughtError,
      onUncaughtError,
      onRecoverableError,
    });
  } else {
    if (cachedPaperRender == null) {
      cachedPaperRender = getPaperRenderer().render;
    }

    cachedPaperRender(element, rootTag, undefined, {
      onCaughtError,
      onUncaughtError,
      onRecoverableError,
    });
  }
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
      cachedFabricDispatchCommand = getFabricRenderer().dispatchCommand;
    }

    return cachedFabricDispatchCommand(handle, command, args);
  } else {
    if (cachedPaperDispatchCommand == null) {
      cachedPaperDispatchCommand = getPaperRenderer().dispatchCommand;
    }

    return cachedPaperDispatchCommand(handle, command, args);
  }
}

export const findHostInstance_DEPRECATED: <TElementType: React.ElementType>(
  // $FlowExpectedError[incompatible-type]
  componentOrHandle: ?(React.ElementRef<TElementType> | number),
) => ?HostInstance = getPaperMethod('findHostInstance_DEPRECATED');

export const findNodeHandle: <TElementType: React.ElementType>(
  // $FlowExpectedError[incompatible-type]
  componentOrHandle: ?(React.ElementRef<TElementType> | number),
) => ?number = getPaperMethod('findNodeHandle');

export const sendAccessibilityEvent: ReactNativeType['sendAccessibilityEvent'] =
  getPaperMethod('sendAccessibilityEvent');

/**
 * This method is used by AppRegistry to unmount a root when using the old
 * React Native renderer (Paper).
 */
export const unmountComponentAtNodeAndRemoveContainer: (
  rootTag: RootTag,
) => void =
  // $FlowExpectedError[incompatible-type]
  getPaperMethod('unmountComponentAtNodeAndRemoveContainer');

export const unstable_batchedUpdates: ReactNativeType['unstable_batchedUpdates'] =
  getPaperMethod('unstable_batchedUpdates');

export const isChildPublicInstance: ReactNativeType['isChildPublicInstance'] =
  getPaperMethod('isChildPublicInstance');

export const getNodeFromInternalInstanceHandle: ReactFabricType['getNodeFromInternalInstanceHandle'] =
  getFabricMethod('getNodeFromInternalInstanceHandle');

export const getPublicInstanceFromInternalInstanceHandle: ReactFabricType['getPublicInstanceFromInternalInstanceHandle'] =
  getFabricMethod('getPublicInstanceFromInternalInstanceHandle');

export const getPublicInstanceFromRootTag: ReactFabricType['getPublicInstanceFromRootTag'] =
  getFabricMethod('getPublicInstanceFromRootTag');

export function isProfilingRenderer(): boolean {
  return Boolean(__DEV__);
}
