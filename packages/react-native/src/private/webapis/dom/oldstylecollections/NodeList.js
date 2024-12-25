/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

// flowlint unsafe-getters-setters:off

import type {ArrayLike} from './ArrayLikeUtils';

import {
  createEntriesIterator,
  createKeyIterator,
  createValueIterator,
} from './ArrayLikeUtils';

// IMPORTANT: The Flow type definition for this module is defined in `NodeList.js.flow`
// because Flow only supports indexers in classes in declaration files.

// $FlowIssue[prop-missing] Flow doesn't understand [Symbol.iterator]() {} and thinks this class doesn't implement the Iterable<T> interface.
export default class NodeList<T> implements Iterable<T>, ArrayLike<T> {
  #length: number;

  /**
   * Use `createNodeList` to create instances of this class.
   *
   * @private This is not defined in the declaration file, so users will not see
   *          the signature of the constructor.
   */
  constructor(elements: $ReadOnlyArray<T>) {
    for (let i = 0; i < elements.length; i++) {
      Object.defineProperty(this, i, {
        value: elements[i],
        writable: false,
      });
    }
    this.#length = elements.length;
  }

  get length(): number {
    return this.#length;
  }

  item(index: number): T | null {
    if (index < 0 || index >= this.#length) {
      return null;
    }

    // assigning to the interface allows us to access the indexer property in a
    // type-safe way.
    // eslint-disable-next-line consistent-this
    const arrayLike: ArrayLike<T> = this;
    return arrayLike[index];
  }

  entries(): Iterator<[number, T]> {
    return createEntriesIterator(this);
  }

  forEach<ThisType>(
    callbackFn: (value: T, index: number, array: NodeList<T>) => mixed,
    thisArg?: ThisType,
  ): void {
    // assigning to the interface allows us to access the indexer property in a
    // type-safe way.
    // eslint-disable-next-line consistent-this
    const arrayLike: ArrayLike<T> = this;

    for (let index = 0; index < this.#length; index++) {
      if (thisArg == null) {
        callbackFn(arrayLike[index], index, this);
      } else {
        callbackFn.call(thisArg, arrayLike[index], index, this);
      }
    }
  }

  keys(): Iterator<number> {
    return createKeyIterator(this);
  }

  values(): Iterator<T> {
    return createValueIterator(this);
  }

  // $FlowIssue[unsupported-syntax] Flow does not support computed properties in classes.
  [Symbol.iterator](): Iterator<T> {
    return createValueIterator(this);
  }
}

/**
 * This is an internal method to create instances of `NodeList`,
 * which avoids leaking its constructor to end users.
 * We can do that because the external definition of `NodeList` lives in
 * `NodeList.js.flow`, not here.
 */
export function createNodeList<T>(elements: $ReadOnlyArray<T>): NodeList<T> {
  return new NodeList(elements);
}
