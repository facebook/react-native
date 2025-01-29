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
import type ReadOnlyCharacterData from '../ReadOnlyCharacterData';
import type ReadOnlyElement from '../ReadOnlyElement';
import type ReadOnlyNode from '../ReadOnlyNode';
import type {
  NativeElementReference,
  NativeNodeReference,
  NativeTextReference,
} from '../specs/NativeDOM';

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

export function getInstanceHandle(node: ReadOnlyNode): InternalInstanceHandle {
  // $FlowExpectedError[prop-missing]
  return node[INSTANCE_HANDLE_KEY];
}

export function setInstanceHandle(
  node: ReadOnlyNode,
  instanceHandle: InternalInstanceHandle,
): void {
  // $FlowExpectedError[prop-missing]
  node[INSTANCE_HANDLE_KEY] = instanceHandle;
}

export function getNativeNodeReference(
  node: ReadOnlyNode,
): ?NativeNodeReference {
  // $FlowExpectedError[incompatible-return]
  return getRendererProxy().getNodeFromInternalInstanceHandle(
    getInstanceHandle(node),
  );
}

export function getNativeElementReference(
  node: ReadOnlyElement,
): ?NativeElementReference {
  // $FlowExpectedError[incompatible-return]
  return getNativeNodeReference(node);
}

export function getNativeTextReference(
  node: ReadOnlyCharacterData,
): ?NativeTextReference {
  // $FlowExpectedError[incompatible-return]
  return getNativeNodeReference(node);
}

export function getPublicInstanceFromInternalInstanceHandle(
  instanceHandle: InternalInstanceHandle,
): ?ReadOnlyNode {
  const mixedPublicInstance =
    getRendererProxy().getPublicInstanceFromInternalInstanceHandle(
      instanceHandle,
    );
  // $FlowExpectedError[incompatible-return] React defines public instances as "mixed" because it can't access the definition from React Native.
  return mixedPublicInstance;
}
