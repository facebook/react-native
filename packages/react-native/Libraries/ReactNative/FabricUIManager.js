/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {
  MeasureOnSuccessCallback,
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  LayoutAnimationConfig,
} from '../Renderer/shims/ReactNativeTypes';

// TODO: type these properly.
type Node = {...};
type NodeSet = Array<Node>;
type NodeProps = {...};
type InstanceHandle = {...};
export type Spec = {|
  +createNode: (
    reactTag: number,
    viewName: string,
    rootTag: number,
    props: NodeProps,
    instanceHandle: InstanceHandle,
  ) => Node,
  +cloneNode: (node: Node) => Node,
  +cloneNodeWithNewChildren: (node: Node) => Node,
  +cloneNodeWithNewProps: (node: Node, newProps: NodeProps) => Node,
  +cloneNodeWithNewChildrenAndProps: (node: Node, newProps: NodeProps) => Node,
  +createChildSet: (rootTag: number) => NodeSet,
  +appendChild: (parentNode: Node, child: Node) => Node,
  +appendChildToSet: (childSet: NodeSet, child: Node) => void,
  +completeRoot: (rootTag: number, childSet: NodeSet) => void,
  +setNativeProps: (node: Node, nativeProps: NodeProps) => void,
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
    // This error isn't currently called anywhere, so the `error` object is really not defined
    // $FlowFixMe
    errorCallback: (error: Object) => void,
  ) => void,
|};

const FabricUIManager: ?Spec = global.nativeFabricUIManager;

module.exports = FabricUIManager;
