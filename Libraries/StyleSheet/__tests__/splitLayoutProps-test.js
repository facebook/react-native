/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const splitLayoutProps = require('../splitLayoutProps');

describe('splitLayoutProps', () => {
  it('should split style object', () => {
    const style = {width: 10, margin: 20, padding: 30};
    const {outer, inner} = splitLayoutProps(style);
    expect(outer.width).toBe(10);
    expect(outer.margin).toBe(20);
    expect(inner.padding).toBe(30);
  });

  it("shouldn't copy values to both returned objects", () => {
    const style = {marginVertical: 5, paddingHorizontal: 10};
    const {outer, inner} = splitLayoutProps(style);
    expect(outer.paddingHorizontal).toBe(undefined);
    expect(inner.marginVertical).toBe(undefined);
  });
});
