/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {InternalInstanceHandle} from '../../../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type ReactNativeDocument from '../ReactNativeDocument';
import type ReadOnlyCharacterData from '../ReadOnlyCharacterData';
import type ReadOnlyElement from '../ReadOnlyElement';
import type ReadOnlyNode from '../ReadOnlyNode';
import type {
  NativeElementReference,
  NativeNodeReference,
  NativeTextReference,
} from '../specs/NativeDOM';
import type {ReactNativeDocumentElementInstanceHandle} from './ReactNativeDocumentElementInstanceHandle';
import type {ReactNativeDocumentInstanceHandle} from './ReactNativeDocumentInstanceHandle';

import {
  getNativeElementReferenceFromReactNativeDocumentElementInstanceHandle,
  getPublicInstanceFromReactNativeDocumentElementInstanceHandle,
  isReactNativeDocumentElementInstanceHandle,
} from './ReactNativeDocumentElementInstanceHandle';
import {
  getNativeNodeReferenceFromReactNativeDocumentInstanceHandle,
  getPublicInstanceFromReactNativeDocumentInstanceHandle,
  isReactNativeDocumentInstanceHandle,
} from './ReactNativeDocumentInstanceHandle';

export type InstanceHandle =
  | InternalInstanceHandle // component managed by React
  | ReactNativeDocumentElementInstanceHandle // root element managed by React Native
  | ReactNativeDocumentInstanceHandle; // document node managed by React Native

let RendererProxy;
function getRendererProxy() {
  if (RendererProxy == null) {
    // Lazy import Fabric here to avoid DOM Node APIs classes from having side-effects.
    // With a static import we can't use these classes for Paper-only variants.
    RendererProxy = require('../../../../../../Libraries/ReactNative/RendererProxy');
  }
  return RendererProxy;
}

const INSTANCE_HANDLE_KEY = Symbol('internalInstanceHandle');
const OWNER_DOCUMENT_KEY = Symbol('ownerDocument');

export function getInstanceHandle(node: ReadOnlyNode): InstanceHandle {
  // $FlowExpectedError[prop-missing]
  return node[INSTANCE_HANDLE_KEY];
}

export function setInstanceHandle(
  node: ReadOnlyNode,
  instanceHandle: InstanceHandle,
): void {
  // $FlowExpectedError[prop-missing]
  node[INSTANCE_HANDLE_KEY] = instanceHandle;
}

export function getOwnerDocument(
  node: ReadOnlyNode,
): ReactNativeDocument | null {
  // $FlowExpectedError[prop-missing]
  return node[OWNER_DOCUMENT_KEY] ?? null;
}

export function setOwnerDocument(
  node: ReadOnlyNode,
  ownerDocument: ReactNativeDocument | null,
): void {
  // $FlowExpectedError[prop-missing]
  node[OWNER_DOCUMENT_KEY] = ownerDocument;
}

export function getPublicInstanceFromInstanceHandle(
  instanceHandle: InstanceHandle,
): ?ReadOnlyNode {
  if (isReactNativeDocumentInstanceHandle(instanceHandle)) {
    return getPublicInstanceFromReactNativeDocumentInstanceHandle(
      instanceHandle,
    );
  }

  if (isReactNativeDocumentElementInstanceHandle(instanceHandle)) {
    return getPublicInstanceFromReactNativeDocumentElementInstanceHandle(
      instanceHandle,
    );
  }

  const mixedPublicInstance =
    getRendererProxy().getPublicInstanceFromInternalInstanceHandle(
      instanceHandle,
    );

  // $FlowExpectedError[incompatible-return] React defines public instances as "mixed" because it can't access the definition from React Native.
  return mixedPublicInstance;
}

export function getNativeNodeReference(
  node: ReadOnlyNode,
): ?NativeNodeReference {
  const instanceHandle = getInstanceHandle(node);

  if (isReactNativeDocumentInstanceHandle(instanceHandle)) {
    return getNativeNodeReferenceFromReactNativeDocumentInstanceHandle(
      instanceHandle,
    );
  }

  if (isReactNativeDocumentElementInstanceHandle(instanceHandle)) {
    return getNativeElementReferenceFromReactNativeDocumentElementInstanceHandle(
      instanceHandle,
    );
  }

  // $FlowExpectedError[incompatible-return]
  return getRendererProxy().getNodeFromInternalInstanceHandle(instanceHandle);
}

export function getNativeElementReference(
  node: ReadOnlyElement,
): ?NativeElementReference {
  // $FlowExpectedError[incompatible-cast] We know ReadOnlyElement instances provide InternalInstanceHandle
  const instanceHandle = getInstanceHandle(node) as InternalInstanceHandle;

  if (isReactNativeDocumentElementInstanceHandle(instanceHandle)) {
    return getNativeElementReferenceFromReactNativeDocumentElementInstanceHandle(
      instanceHandle,
    );
  }

  // $FlowExpectedError[incompatible-return]
  return getRendererProxy().getNodeFromInternalInstanceHandle(instanceHandle);
}

export function getNativeTextReference(
  node: ReadOnlyCharacterData,
): ?NativeTextReference {
  // $FlowExpectedError[incompatible-cast] We know ReadOnlyText instances provide InternalInstanceHandle
  const instanceHandle = getInstanceHandle(node) as InternalInstanceHandle;

  // $FlowExpectedError[incompatible-return]
  return getRendererProxy().getNodeFromInternalInstanceHandle(instanceHandle);
}
