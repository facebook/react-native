/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import DOMRectReadOnly from '../../geometry/DOMRectReadOnly';
import {createDOMRectList} from '../DOMRectList';

const domRectA = new DOMRectReadOnly();
const domRectB = new DOMRectReadOnly();
const domRectC = new DOMRectReadOnly();

describe('DOMRectList', () => {
  it('provides an array-like interface', () => {
    const collection = createDOMRectList([domRectA, domRectB, domRectC]);

    expect(collection[0]).toBe(domRectA);
    expect(collection[1]).toBe(domRectB);
    expect(collection[2]).toBe(domRectC);
    expect(collection[3]).toBe(undefined);
    expect(collection.length).toBe(3);
  });

  it('is immutable (loose mode)', () => {
    const collection = createDOMRectList([domRectA, domRectB, domRectC]);

    collection[0] = new DOMRectReadOnly();
    expect(collection[0]).toBe(domRectA);

    // $FlowExpectedError[cannot-write]
    collection.length = 100;
    expect(collection.length).toBe(3);
  });

  it('is immutable (strict mode)', () => {
    'use strict';

    const collection = createDOMRectList([domRectA, domRectB, domRectC]);

    expect(() => {
      collection[0] = new DOMRectReadOnly();
    }).toThrow(TypeError);
    expect(collection[0]).toBe(domRectA);

    expect(() => {
      // $FlowExpectedError[cannot-write]
      collection.length = 100;
    }).toThrow(TypeError);
    expect(collection.length).toBe(3);
  });

  it('can be converted to an array through common methods', () => {
    const collection = createDOMRectList([domRectA, domRectB, domRectC]);

    expect(Array.from(collection)).toEqual([domRectA, domRectB, domRectC]);
    expect([...collection]).toEqual([domRectA, domRectB, domRectC]);
  });

  it('can be traversed with for-of', () => {
    const collection = createDOMRectList([domRectA, domRectB, domRectC]);

    let i = 0;
    for (const value of collection) {
      expect(value).toBe(collection[i]);
      i++;
    }
  });

  describe('item()', () => {
    it('returns elements at the specified position, or null', () => {
      const collection = createDOMRectList([domRectA, domRectB, domRectC]);

      expect(collection.item(0)).toBe(domRectA);
      expect(collection.item(1)).toBe(domRectB);
      expect(collection.item(2)).toBe(domRectC);
      expect(collection.item(3)).toBe(null);
    });
  });
});
