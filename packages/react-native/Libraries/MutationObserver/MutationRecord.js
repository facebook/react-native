/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// flowlint unsafe-getters-setters:off

import type ReactNativeElement from '../DOM/Nodes/ReactNativeElement';
import type ReadOnlyNode from '../DOM/Nodes/ReadOnlyNode';
import type {NativeMutationRecord} from './NativeMutationObserver';

import NodeList, {createNodeList} from '../DOM/OldStyleCollections/NodeList';

export type MutationType = 'attributes' | 'characterData' | 'childList';

/**
 * The `MutationRecord` is a read-only interface that represents an individual
 * DOM mutation observed by a `MutationObserver`.
 *
 * It is the object inside the array passed to the callback of a `MutationObserver`.
 */
export default class MutationRecord {
  _target: ReactNativeElement;
  _addedNodes: NodeList<ReadOnlyNode>;
  _removedNodes: NodeList<ReadOnlyNode>;

  constructor(nativeRecord: NativeMutationRecord) {
    // $FlowExpectedError[incompatible-cast] the codegen doesn't support the actual type.
    const target = (nativeRecord.target: ReactNativeElement);
    this._target = target;
    // $FlowExpectedError[incompatible-cast] the codegen doesn't support the actual type.
    const addedNodes = (nativeRecord.addedNodes: $ReadOnlyArray<ReadOnlyNode>);
    this._addedNodes = createNodeList(addedNodes);
    const removedNodes =
      // $FlowExpectedError[incompatible-cast] the codegen doesn't support the actual type.
      (nativeRecord.removedNodes: $ReadOnlyArray<ReadOnlyNode>);
    this._removedNodes = createNodeList(removedNodes);
  }

  get addedNodes(): NodeList<ReadOnlyNode> {
    return this._addedNodes;
  }

  get attributeName(): string | null {
    return null;
  }

  get nextSibling(): ReadOnlyNode | null {
    return null;
  }

  get oldValue(): mixed | null {
    return null;
  }

  get previousSibling(): ReadOnlyNode | null {
    return null;
  }

  get removedNodes(): NodeList<ReadOnlyNode> {
    return this._removedNodes;
  }

  get target(): ReactNativeElement {
    return this._target;
  }

  get type(): MutationType {
    return 'childList';
  }
}

export function createMutationRecord(
  entry: NativeMutationRecord,
): MutationRecord {
  return new MutationRecord(entry);
}
