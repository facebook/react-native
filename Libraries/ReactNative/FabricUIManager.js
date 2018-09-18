/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */
'use strict';

// TODO: type these properly.
type Node = {};
type NodeSet = Array<Node>;
type NodeProps = {};
type InstanceHandle = {};
type Spec = {|
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
|};

const FabricUIManager: ?Spec = global.nativeFabricUIManager;

module.exports = FabricUIManager;
