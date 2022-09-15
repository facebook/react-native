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
    };
    const processedStyle = processLayoutProps(style);
    expect(processedStyle.marginStart).toBe(10);
    expect(processedStyle.marginEnd).toBe(20);
    expect(processedStyle.marginTop).toBe(30);
    expect(processedStyle.marginBottom).toBe(40);
    expect(processedStyle.marginVertical).toBe(50);
    expect(processedStyle.marginHorizontal).toBe(60);
    expect(processedStyle.paddingStart).toBe(70);
    expect(processedStyle.paddingEnd).toBe(80);
    expect(processedStyle.paddingTop).toBe(90);
    expect(processedStyle.paddingBottom).toBe(100);
    expect(processedStyle.paddingVertical).toBe(110);
    expect(processedStyle.paddingHorizontal).toBe(120);

    expect(processedStyle.marginInlineStart).toBe(undefined);
    expect(processedStyle.marginInlineEnd).toBe(undefined);
    expect(processedStyle.marginBlockStart).toBe(undefined);
    expect(processedStyle.marginBlockEnd).toBe(undefined);
    expect(processedStyle.marginBlock).toBe(undefined);
    expect(processedStyle.marginInline).toBe(undefined);
    expect(processedStyle.paddingInlineStart).toBe(undefined);
    expect(processedStyle.paddingInlineEnd).toBe(undefined);
    expect(processedStyle.paddingBlockStart).toBe(undefined);
    expect(processedStyle.paddingBlockEnd).toBe(undefined);
    expect(processedStyle.paddingBlock).toBe(undefined);
    expect(processedStyle.paddingInline).toBe(undefined);
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
