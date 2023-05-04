/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {
  InternalInstanceHandle,
  LayoutAnimationConfig,
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
  Node,
} from '../Renderer/shims/ReactNativeTypes';
import type {RootTag} from '../Types/RootTagTypes';

export type NodeSet = Array<Node>;
export type NodeProps = {...};
export type Spec = {|
  +createNode: (
    reactTag: number,
    viewName: string,
    rootTag: RootTag,
    props: NodeProps,
    instanceHandle: InternalInstanceHandle,
  ) => Node,
  +cloneNode: (node: Node) => Node,
  +cloneNodeWithNewChildren: (node: Node) => Node,
  +cloneNodeWithNewProps: (node: Node, newProps: NodeProps) => Node,
  +cloneNodeWithNewChildrenAndProps: (node: Node, newProps: NodeProps) => Node,
  +createChildSet: (rootTag: RootTag) => NodeSet,
  +appendChild: (parentNode: Node, child: Node) => Node,
  +appendChildToSet: (childSet: NodeSet, child: Node) => void,
  +completeRoot: (rootTag: RootTag, childSet: NodeSet) => void,
  +measure: (node: Node, callback: MeasureOnSuccessCallback) => void,
  +measureInWindow: (
    node: Node,
    callback: MeasureInWindowOnSuccessCallback,
  ) => void,
  +measureLayout: (
    node: Node,
    relativeNode: Node,
    onFail: () => void,
    onSuccess: MeasureLayoutOnSuccessCallback,
  ) => void,
  +configureNextLayoutAnimation: (
    config: LayoutAnimationConfig,
    callback: () => void, // check what is returned here
    errorCallback: () => void,
  ) => void,
  +sendAccessibilityEvent: (node: Node, eventType: string) => void,
  +findShadowNodeByTag_DEPRECATED: (reactTag: number) => ?Node,
  +setNativeProps: (node: Node, newProps: NodeProps) => void,
  +dispatchCommand: (
    node: Node,
    commandName: string,
    args: Array<mixed>,
  ) => void,

  /**
   * Support methods for the DOM-compatible APIs.
   */
  +getParentNode: (node: Node) => ?InternalInstanceHandle,
  +getChildNodes: (node: Node) => $ReadOnlyArray<InternalInstanceHandle>,
  +isConnected: (node: Node) => boolean,
  +compareDocumentPosition: (node: Node, otherNode: Node) => number,
  +getTextContent: (node: Node) => string,
  +getBoundingClientRect: (
    node: Node,
  ) => ?[
    /* x:*/ number,
    /* y:*/ number,
    /* width:*/ number,
    /* height:*/ number,
  ],
  +getOffset: (
    node: Node,
  ) => ?[
    /* offsetParent: */ InternalInstanceHandle,
    /* offsetTop: */ number,
    /* offsetLeft: */ number,
  ],
|};

// This is exposed as a getter because apps using the legacy renderer AND
// Fabric can define the binding lazily. If we evaluated the global and cached
// it in the module we might be caching an `undefined` value before it is set.
export function getFabricUIManager(): ?Spec {
  return global.nativeFabricUIManager;
}
