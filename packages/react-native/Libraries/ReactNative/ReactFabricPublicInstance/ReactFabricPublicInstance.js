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

import type ReactNativeDocumentT from '../../../src/private/webapis/dom/nodes/ReactNativeDocument';
import typeof * as ReactNativeDocumentModuleT from '../../../src/private/webapis/dom/nodes/ReactNativeDocument';
import type ReactNativeElementT from '../../../src/private/webapis/dom/nodes/ReactNativeElement';
import type ReadOnlyTextT from '../../../src/private/webapis/dom/nodes/ReadOnlyText';
import typeof * as RendererProxyT from '../../ReactNative/RendererProxy';
import type {
  InternalInstanceHandle,
  Node,
  ViewConfig,
} from '../../Renderer/shims/ReactNativeTypes';
import type {RootTag} from '../RootTag';
import type ReactFabricHostComponentT from './ReactFabricHostComponent';

import * as ReactNativeFeatureFlags from '../../../src/private/featureflags/ReactNativeFeatureFlags';

export opaque type PublicRootInstance = mixed;

// Lazy loaded to avoid evaluating the module when using the legacy renderer.
let ReactNativeDocumentModuleObject: ?ReactNativeDocumentModuleT;
let ReactFabricHostComponentClass: Class<ReactFabricHostComponentT>;
let ReactNativeElementClass: Class<ReactNativeElementT>;
let ReadOnlyTextClass: Class<ReadOnlyTextT>;
let RendererProxy: RendererProxyT;

function getReactNativeDocumentModule(): ReactNativeDocumentModuleT {
  if (ReactNativeDocumentModuleObject == null) {
    // We initialize this lazily to avoid a require cycle.
    ReactNativeDocumentModuleObject = require('../../../src/private/webapis/dom/nodes/ReactNativeDocument');
  }

  return ReactNativeDocumentModuleObject;
}

function getReactNativeElementClass(): Class<ReactNativeElementT> {
  if (ReactNativeElementClass == null) {
    ReactNativeElementClass =
      require('../../../src/private/webapis/dom/nodes/ReactNativeElement').default;
  }
  return ReactNativeElementClass;
}

function getReactFabricHostComponentClass(): Class<ReactFabricHostComponentT> {
  if (ReactFabricHostComponentClass == null) {
    ReactFabricHostComponentClass =
      require('./ReactFabricHostComponent').default;
  }
  return ReactFabricHostComponentClass;
}

function getReadOnlyTextClass(): Class<ReadOnlyTextT> {
  if (ReadOnlyTextClass == null) {
    ReadOnlyTextClass =
      require('../../../src/private/webapis/dom/nodes/ReadOnlyText').default;
  }
  return ReadOnlyTextClass;
}

export function createPublicRootInstance(rootTag: RootTag): PublicRootInstance {
  if (ReactNativeFeatureFlags.enableAccessToHostTreeInFabric()) {
    const ReactNativeDocumentModule = getReactNativeDocumentModule();

    // $FlowExpectedError[incompatible-return]
    return ReactNativeDocumentModule.createReactNativeDocument(rootTag);
  }

  // $FlowExpectedError[incompatible-return]
  return null;
}

export function createPublicInstance(
  tag: number,
  viewConfig: ViewConfig,
  internalInstanceHandle: InternalInstanceHandle,
  ownerDocument: ReactNativeDocumentT,
): ReactFabricHostComponentT | ReactNativeElementT {
  if (ReactNativeFeatureFlags.enableAccessToHostTreeInFabric()) {
    const ReactNativeElement = getReactNativeElementClass();
    return new ReactNativeElement(
      tag,
      viewConfig,
      internalInstanceHandle,
      ownerDocument,
    );
  } else {
    const ReactFabricHostComponent = getReactFabricHostComponentClass();
    return new ReactFabricHostComponent(
      tag,
      viewConfig,
      internalInstanceHandle,
    );
  }
}

export function createPublicTextInstance(
  internalInstanceHandle: InternalInstanceHandle,
  ownerDocument: ReactNativeDocumentT,
): ReadOnlyTextT {
  const ReadOnlyText = getReadOnlyTextClass();
  return new ReadOnlyText(internalInstanceHandle, ownerDocument);
}

export function getNativeTagFromPublicInstance(
  publicInstance: ReactFabricHostComponentT | ReactNativeElementT,
): number {
  return publicInstance.__nativeTag;
}

export function getNodeFromPublicInstance(
  publicInstance: ReactFabricHostComponentT | ReactNativeElementT,
): ?Node {
  // Avoid loading ReactFabric if using an instance from the legacy renderer.
  if (publicInstance.__internalInstanceHandle == null) {
    return null;
  }

  if (RendererProxy == null) {
    RendererProxy = require('../../ReactNative/RendererProxy');
  }
  return RendererProxy.getNodeFromInternalInstanceHandle(
    // $FlowExpectedError[incompatible-call] __internalInstanceHandle is always an InternalInstanceHandle from React when we get here.
    publicInstance.__internalInstanceHandle,
  );
}

export function getInternalInstanceHandleFromPublicInstance(
  publicInstance: ReactFabricHostComponentT | ReactNativeElementT,
): InternalInstanceHandle {
  // TODO(T174762768): Remove this once OSS versions of renderers will be synced.
  // $FlowExpectedError[prop-missing] Keeping this for backwards-compatibility with the renderers versions in open source.
  if (publicInstance._internalInstanceHandle != null) {
    // $FlowExpectedError[incompatible-return] Keeping this for backwards-compatibility with the renderers versions in open source.
    return publicInstance._internalInstanceHandle;
  }

  // $FlowExpectedError[incompatible-return] __internalInstanceHandle is always an InternalInstanceHandle from React when we get here.
  return publicInstance.__internalInstanceHandle;
}
