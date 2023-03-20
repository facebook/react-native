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

import type HTMLCollection from '../OldStyleCollections/HTMLCollection';

import ReadOnlyNode from './ReadOnlyNode';

export default class ReadOnlyElement extends ReadOnlyNode {
  get childElementCount(): number {
    throw new TypeError('Unimplemented');
  }

  get children(): HTMLCollection<ReadOnlyElement> {
    throw new TypeError('Unimplemented');
  }

  get clientHeight(): number {
    throw new TypeError('Unimplemented');
  }

  get clientLeft(): number {
    throw new TypeError('Unimplemented');
  }

  get clientTop(): number {
    throw new TypeError('Unimplemented');
  }

  get clientWidth(): number {
    throw new TypeError('Unimplemented');
  }

  get firstElementChild(): ReadOnlyElement | null {
    throw new TypeError('Unimplemented');
  }

  get id(): string {
    throw new TypeError('Unimplemented');
  }

  get lastElementChild(): ReadOnlyElement | null {
    throw new TypeError('Unimplemented');
  }

  get nextElementSibling(): ReadOnlyElement | null {
    throw new TypeError('Unimplemented');
  }

  get previousElementSibling(): ReadOnlyElement | null {
    throw new TypeError('Unimplemented');
  }

  get scrollHeight(): number {
    throw new TypeError('Unimplemented');
  }

  get scrollLeft(): number {
    throw new TypeError('Unimplemented');
  }

  get scrollTop(): number {
    throw new TypeError('Unimplemented');
  }

  get scrollWidth(): number {
    throw new TypeError('Unimplemented');
  }

  get tagName(): string {
    throw new TypeError('Unimplemented');
  }

  getBoundingClientRect(): DOMRect {
    throw new TypeError('Unimplemented');
  }

  getClientRects(): DOMRectList {
    throw new TypeError('Unimplemented');
  }
}
