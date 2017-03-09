// @flow

import invariant from 'invariant';

export type Stack = {
  id: number,
  [frameId: number]: Stack,
}

export type FlattenedStack = Int32Array;

type StackIdMap = Array<FlattenedStack>;

export default class StackRegistry {
  root: ?Stack = { id: 0 };
  nodeCount: number = 1;
  maxDepth: number = -1;
  stackIdMap: ?StackIdMap = null;

  insert(parent: Stack, frameId: number): Stack {
    invariant(this.stackIdMap === null, 'Stacks already flattened!');
    let node = parent[frameId];
    if (node === undefined) {
      node = { id: this.nodeCount };
      this.nodeCount += 1;

      // TODO: make a builder instead of mutating the array?
      parent[frameId] = node;  // eslint-disable-line no-param-reassign
    }
    return node;
  }

  get(id: number): FlattenedStack {
    invariant(this.stackIdMap, 'Stacks not flattened!');
    return this.stackIdMap[id];
  }

  flatten() {
    if (this.stackIdMap !== null) {
      return;
    }
    let stackFrameCount = 0;
    function countStacks(tree: Stack, depth: number): boolean {
      let leaf = true;
      Object.keys(tree).forEach((frameId: any) => {
        if (frameId !== 'id') {
          leaf = countStacks(tree[Number(frameId)], depth + 1);
        }
      });
      if (leaf) {
        stackFrameCount += depth;
      }
      return false;
    }
    const root = this.root;
    invariant(root, 'Stacks already flattened');
    countStacks(root, 0);
    const stackIdMap = new Array(this.nodeCount);
    const stackArray = new Int32Array(stackFrameCount);
    let maxStackDepth = 0;
    stackFrameCount = 0;
    function flattenStacksImpl(tree: Stack, stack: Array<number>): void {
      let childStack;
      maxStackDepth = Math.max(maxStackDepth, stack.length);
      Object.keys(tree).forEach((frameId: any) => {
        if (frameId !== 'id') {
          stack.push(Number(frameId));
          childStack = flattenStacksImpl(tree[frameId], stack);
          stack.pop();
        }
      });

      const id = tree.id;
      invariant(
        id >= 0 && id < stackIdMap.length && stackIdMap[id] === undefined,
        'Invalid stack ID!');

      if (childStack !== undefined) {
        // each child must have our stack as a prefix, so just use that
        stackIdMap[id] = childStack.subarray(0, stack.length);
      } else {
        const newStack = stackArray.subarray(stackFrameCount, stackFrameCount + stack.length);
        stackFrameCount += stack.length;
        for (let i = 0; i < stack.length; i++) {
          newStack[i] = stack[i];
        }
        stackIdMap[id] = newStack;
      }
      return stackIdMap[id];
    }
    flattenStacksImpl(root, []);
    this.root = null;
    this.stackIdMap = stackIdMap;
    this.maxDepth = maxStackDepth;
  }
}
