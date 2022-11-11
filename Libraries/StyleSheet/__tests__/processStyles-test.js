/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const processLayoutProps = require('../processStyles');

describe('processLayoutProps', () => {
  it('it should map layout style properties', () => {
    const style = {
      backgroundColor: 'white',
      marginInlineStart: 10,
      marginInlineEnd: 20,
      marginBlockStart: 30,
      marginBlockEnd: 40,
      marginBlock: 50,
      marginInline: 60,
      paddingInlineStart: 70,
      paddingInlineEnd: 80,
      paddingBlockStart: 90,
      paddingBlockEnd: 100,
      paddingBlock: 110,
      paddingInline: 120,
      verticalAlign: 'middle',
    };
    const processedStyle = processLayoutProps(style);
    expect(processedStyle).toMatchInlineSnapshot(`
      Object {
        "backgroundColor": "white",
        "marginBottom": 40,
        "marginEnd": 20,
        "marginHorizontal": 60,
        "marginStart": 10,
        "marginTop": 30,
        "marginVertical": 50,
        "paddingBottom": 100,
        "paddingEnd": 80,
        "paddingHorizontal": 120,
        "paddingStart": 70,
        "paddingTop": 90,
        "paddingVertical": 110,
        "textAlignVertical": "center",
      }
    `);
  });

  it('should override style properties', () => {
    const style = {marginStart: 20, marginInlineStart: 40};
    const processedStyle = processLayoutProps(style);
    expect(processedStyle.marginStart).toBe(40);
  });

  it('should overwrite properties with `undefined`', () => {
    const style = {marginInlineStart: 40, marginStart: undefined};
    const processedStyle = processLayoutProps(style);
    expect(processedStyle.marginStart).toBe(40);
  });

  it('should not fail on falsy values', () => {
    expect(() => processLayoutProps({})).not.toThrow();
    expect(() => processLayoutProps(null)).not.toThrow();
    expect(() => processLayoutProps(false)).not.toThrow();
    expect(() => processLayoutProps(undefined)).not.toThrow();
  });

  it('should not change style if there is no  layout style property', () => {
    const style = {backgroundColor: '#000', width: 10};
    const processedStyle = processLayoutProps(style);
    expect(processedStyle).toStrictEqual(style);
  });
});
