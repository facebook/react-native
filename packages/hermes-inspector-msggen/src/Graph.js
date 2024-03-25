/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import invariant from 'assert';

type NodeId = string;
type NodeCycle = {from: NodeId, to: NodeId};

class Node {
  id: NodeId;
  children: Set<Node>;
  state: 'none' | 'visiting' | 'visited';

  constructor(id: NodeId) {
    this.id = id;
    this.children = new Set();
    this.state = 'none';
  }
}

export class Graph {
  nodes: Map<NodeId, Node>;

  constructor() {
    this.nodes = new Map();
  }

  addNode(nodeId: NodeId): Node {
    let node = this.nodes.get(nodeId);
    if (!node) {
      node = new Node(nodeId);
      this.nodes.set(nodeId, node);
    }
    return node;
  }

  addEdge(srcId: NodeId, dstId: NodeId) {
    const src = this.addNode(srcId);
    const dst = this.addNode(dstId);
    src.children.add(dst);
  }

  // traverse returns all nodes in the graph reachable from the given rootIds.
  // the returned nodes are topologically sorted, with the deepest nodes
  // returned first.
  traverse(rootIds: Array<NodeId>): {
    nodes: Array<NodeId>,
    cycles: Array<NodeCycle>,
  } {
    // clear marks
    for (const node of this.nodes.values()) {
      node.state = 'none';
    }

    // make a fake root node that points to all the provided rootIds
    const root = new Node('root');
    for (const id of rootIds) {
      const node = this.nodes.get(id);
      invariant(node != null, `No node ${id} in graph`);
      root.children.add(node);
    }

    const nodes: Array<NodeId> = [];
    const cycles: Array<NodeCycle> = [];
    postorder(root, nodes, cycles);

    // remove fake root node
    nodes.splice(-1);

    return {nodes: nodes, cycles: cycles};
  }
}

function postorder(node: Node, nodes: Array<NodeId>, cycles: Array<NodeCycle>) {
  if (node.state === 'visited') {
    return;
  }

  node.state = 'visiting';
  for (const child of node.children) {
    if (child.state === 'visiting') {
      // This will lead to a cycle; we need to mark that and move on
      cycles.push({from: node.id, to: child.id});
    } else {
      postorder(child, nodes, cycles);
    }
  }

  node.state = 'visited';
  nodes.push(node.id);
}
