/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
} from '../../src/private/types/HostInstance';
import type {NativeElementReference} from '../../src/private/webapis/dom/nodes/specs/NativeDOM';
import type {
  InternalInstanceHandle,
  LayoutAnimationConfig,
  Node,
} from '../Renderer/shims/ReactNativeTypes';
import type {RootTag} from '../Types/RootTagTypes';

import defineLazyObjectProperty from '../Utilities/defineLazyObjectProperty';

export type NodeSet = Array<Node>;
export type NodeProps = {...};
export interface Spec {
  +createNode: (
    reactTag: number,
    viewName: string,
    rootTag: RootTag,
    props: NodeProps,
    instanceHandle: InternalInstanceHandle,
  ) => Node;
  +cloneNode: (node: Node) => Node;
  +cloneNodeWithNewChildren: (node: Node) => Node;
  +cloneNodeWithNewProps: (node: Node, newProps: NodeProps) => Node;
  +cloneNodeWithNewChildrenAndProps: (node: Node, newProps: NodeProps) => Node;
  +createChildSet: (rootTag: RootTag) => NodeSet;
  +appendChild: (parentNode: Node, child: Node) => Node;
  +appendChildToSet: (childSet: NodeSet, child: Node) => void;
  +completeRoot: (rootTag: RootTag, childSet: NodeSet) => void;
  +measure: (
    node: Node | NativeElementReference,
    callback: MeasureOnSuccessCallback,
  ) => void;
  +measureInWindow: (
    node: Node | NativeElementReference,
    callback: MeasureInWindowOnSuccessCallback,
  ) => void;
  +measureLayout: (
    node: Node | NativeElementReference,
    relativeNode: Node | NativeElementReference,
    onFail: () => void,
    onSuccess: MeasureLayoutOnSuccessCallback,
  ) => void;
  +configureNextLayoutAnimation: (
    config: LayoutAnimationConfig,
    callback: () => void, // check what is returned here
    errorCallback: () => void,
  ) => void;
  +sendAccessibilityEvent: (node: Node, eventType: string) => void;
  +findShadowNodeByTag_DEPRECATED: (reactTag: number) => ?Node;
  +setNativeProps: (
    node: Node | NativeElementReference,
    newProps: NodeProps,
  ) => void;
  +dispatchCommand: (
    node: Node,
    commandName: string,
    args: Array<mixed>,
  ) => void;
  +findNodeAtPoint: (
    node: Node,
    locationX: number,
    locationY: number,
    callback: (instanceHandle: ?InternalInstanceHandle) => void,
  ) => void;
  +compareDocumentPosition: (
    node: Node | NativeElementReference,
    otherNode: Node | NativeElementReference,
  ) => number;
  +getBoundingClientRect: (
    node: Node | NativeElementReference,
    includeTransform: boolean,
  ) => ?[
    /* x: */ number,
    /* y: */ number,
    /* width: */ number,
    /* height: */ number,
  ];
}

let nativeFabricUIManagerProxy: ?Spec;

// This is a list of all the methods in global.nativeFabricUIManager that we'll
// cache in JavaScript, as the current implementation of the binding
// creates a new host function every time methods are accessed.
const CACHED_PROPERTIES = [
  'createNode',
  'cloneNode',
  'cloneNodeWithNewChildren',
  'cloneNodeWithNewProps',
  'cloneNodeWithNewChildrenAndProps',
  'createChildSet',
  'appendChild',
  'appendChildToSet',
  'completeRoot',
  'measure',
  'measureInWindow',
  'measureLayout',
  'configureNextLayoutAnimation',
  'sendAccessibilityEvent',
  'findShadowNodeByTag_DEPRECATED',
  'setNativeProps',
  'dispatchCommand',
  'compareDocumentPosition',
  'getBoundingClientRect',
];

// This is exposed as a getter because apps using the legacy renderer AND
// Fabric can define the binding lazily. If we evaluated the global and cached
// it in the module we might be caching an `undefined` value before it is set.
export function getFabricUIManager(): ?Spec {
  if (
    nativeFabricUIManagerProxy == null &&
    global.nativeFabricUIManager != null
  ) {
    nativeFabricUIManagerProxy = createProxyWithCachedProperties(
      global.nativeFabricUIManager,
      CACHED_PROPERTIES,
    );
  }
  return nativeFabricUIManagerProxy;
}

/**
 *
 * Returns an object that caches the specified properties the first time they
 * are accessed, and falls back to the original object for other properties.
 */
function createProxyWithCachedProperties(
  implementation: Spec,
  propertiesToCache: $ReadOnlyArray<string>,
): Spec {
  const proxy = Object.create(implementation);
  for (const propertyName of propertiesToCache) {
    defineLazyObjectProperty(proxy, propertyName, {
      // $FlowExpectedError[prop-missing]
      get: () => implementation[propertyName],
    });
  }
  return proxy;
}
