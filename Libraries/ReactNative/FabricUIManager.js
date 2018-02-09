/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FabricUIManager
 * @flow
 * @format
 */
'use strict';

// TODO: fix the types
type Node = number;
type NodeSet = number;
type NodeProps = {};
type Spec = {|
  +createNode: (
    reactTag: number,
    viewName: string,
    rootTag: number,
    props: NodeProps,
    instanceHandle: number,
  ) => Node,
  +cloneNode: (node: Node) => Node,
  +cloneNodeWithNewChildren: (node: Node) => Node,
  +cloneNodeWithNewProps: (node: Node, newProps: NodeProps) => Node,
  +cloneNodeWithNewChildrenAndProps: (node: Node, newProps: NodeProps) => Node,
  +appendChild: (parentNode: Node, child: Node) => Node,
  +appendChildToSet: (childSet: NodeSet, child: Node) => void,
  +completeRoot: (rootTag: number, childSet: NodeSet) => void,
|};

const NativeFabricUIManager: Spec = require('NativeModules').FabricUIManager;

const FabricUIManager: Spec = {
  createNode(
    reactTag: number,
    viewName: string,
    rootTag: number,
    props: NodeProps,
    instanceHandle: number,
  ): number {
    return NativeFabricUIManager.createNode(
      reactTag,
      viewName,
      rootTag,
      props,
      0, // TODO: instanceHandle is cannot be JSON serialized.
    );
  },
  cloneNode: NativeFabricUIManager.cloneNode,
  cloneNodeWithNewChildren: NativeFabricUIManager.cloneNodeWithNewChildren,
  cloneNodeWithNewProps: NativeFabricUIManager.cloneNodeWithNewProps,
  cloneNodeWithNewChildrenAndProps:
    NativeFabricUIManager.cloneNodeWithNewChildrenAndProps,
  appendChild: NativeFabricUIManager.appendChild,
  appendChildToSet: NativeFabricUIManager.appendChildToSet,
  completeRoot: NativeFabricUIManager.completeRoot,
};

module.exports = FabricUIManager;
