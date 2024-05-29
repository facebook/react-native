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

import type ReactNativeElement from '../../src/private/webapis/dom/nodes/ReactNativeElement';
import type ReadOnlyNode from '../../src/private/webapis/dom/nodes/ReadOnlyNode';
import type {NativeMutationRecord} from './NativeMutationObserver';

import NodeList, {
  createNodeList,
} from '../../src/private/webapis/dom/oldstylecollections/NodeList';

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
    // $FlowExpectedError[incompatible-type] the codegen doesn't support the actual type.
    const target: ReactNativeElement = nativeRecord.target;
    this._target = target;
    // $FlowExpectedError[incompatible-type] the codegen doesn't support the actual type.
    const addedNodes: $ReadOnlyArray<ReadOnlyNode> = nativeRecord.addedNodes;
    this._addedNodes = createNodeList(addedNodes);
    const removedNodes: $ReadOnlyArray<ReadOnlyNode> =
      // $FlowFixMe[incompatible-type]
      nativeRecord.removedNodes;
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
