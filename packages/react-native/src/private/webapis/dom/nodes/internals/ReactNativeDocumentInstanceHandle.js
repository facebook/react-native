/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {RootTag} from '../../../../../../Libraries/ReactNative/RootTag';
import type ReactNativeDocument from '../ReactNativeDocument';
import type {NativeNodeReference} from '../specs/NativeDOM';

import * as RendererProxy from '../../../../../../Libraries/ReactNative/RendererProxy';

export opaque type ReactNativeDocumentInstanceHandle = RootTag;

export function createReactNativeDocumentInstanceHandle(
  rootTag: RootTag,
): ReactNativeDocumentInstanceHandle {
  return rootTag;
}

export function getNativeNodeReferenceFromReactNativeDocumentInstanceHandle(
  instanceHandle: ReactNativeDocumentInstanceHandle,
): ?NativeNodeReference {
  return instanceHandle;
}

export function getPublicInstanceFromReactNativeDocumentInstanceHandle(
  instanceHandle: ReactNativeDocumentInstanceHandle,
): ?ReactNativeDocument {
  // $FlowExpectedError[incompatible-return] React defines public instances as "mixed" because it can't access the definition from React Native.
  return RendererProxy.getPublicInstanceFromRootTag(Number(instanceHandle));
}

export function isReactNativeDocumentInstanceHandle(
  instanceHandle: mixed,
  // $FlowExpectedError[incompatible-type-guard]
): instanceHandle is ReactNativeDocumentInstanceHandle {
  return typeof instanceHandle === 'number' && instanceHandle % 10 === 1;
}
