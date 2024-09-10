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

import AnimatedProps from '../nodes/AnimatedProps';

describe('AnimatedProps', () => {
  function getValue(inputProps: {[string]: mixed}) {
    const animatedProps = new AnimatedProps(inputProps, jest.fn());
    return animatedProps.__getValue();
  }

  it('returns original `style` if it has no nodes', () => {
    const style = {color: 'red'};
    expect(getValue({style}).style).toBe(style);
  });

  it('returns original `style` for invalid style values', () => {
    const values = [undefined, null, function () {}, true, 123, 'foo'];
    for (const value of values) {
      expect(getValue({style: value})).toEqual({style: value});
    }
  });
});
