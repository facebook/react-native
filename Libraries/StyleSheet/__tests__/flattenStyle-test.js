/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 */
'use strict';

const StyleSheet = require('StyleSheet');
const StyleSheetValidation = require('StyleSheetValidation');
const flattenStyle = require('flattenStyle');

function getFixture() {
  StyleSheetValidation.addValidStylePropTypes({
    styleA: () => {},
    styleB: () => {},
  });

  return StyleSheet.create({
    elementA: {
      styleA: 'moduleA/elementA/styleA',
      styleB: 'moduleA/elementA/styleB',
    },
    elementB: {
      styleB: 'moduleA/elementB/styleB',
    },
  });
}

describe('flattenStyle', () => {
  it('should merge style objects', () => {
    const style1 = {width: 10};
    const style2 = {height: 20};
    const flatStyle = flattenStyle([style1, style2]);
    expect(flatStyle.width).toBe(10);
    expect(flatStyle.height).toBe(20);
  });

  it('should override style properties', () => {
    const style1 = {backgroundColor: '#000', width: 10};
    const style2 = {backgroundColor: '#023c69', width: null};
    const flatStyle = flattenStyle([style1, style2]);
    expect(flatStyle.backgroundColor).toBe('#023c69');
    expect(flatStyle.width).toBe(null);
  });

  it('should overwrite properties with `undefined`', () => {
    const style1 = {backgroundColor: '#000'};
    const style2 = {backgroundColor: undefined};
    const flatStyle = flattenStyle([style1, style2]);
    expect(flatStyle.backgroundColor).toBe(undefined);
  });

  it('should not fail on falsy values', () => {
    expect(() => flattenStyle([null, false, undefined])).not.toThrow();
  });

  it('should recursively flatten arrays', () => {
    const style1 = {width: 10};
    const style2 = {height: 20};
    const style3 = {width: 30};
    const flatStyle = flattenStyle([null, [], [style1, style2], style3]);
    expect(flatStyle.width).toBe(30);
    expect(flatStyle.height).toBe(20);
  });

  it('should not allocate an object when there is no style', () => {
    const nullStyle = flattenStyle(null);
    const nullStyleAgain = flattenStyle(null);

    expect(nullStyle).toBe(nullStyleAgain);
    expect(nullStyle).toBe(undefined);
  });

  it('should not allocate an object when there is a style', () => {
    const style = {a: 'b'};
    const nullStyle = flattenStyle(style);

    expect(nullStyle).toBe(style);
  });

  it('should not allocate an object when there is a single class', () => {
    const fixture = getFixture();
    var singleStyle = flattenStyle(fixture.elementA);
    var singleStyleAgain = flattenStyle(fixture.elementA);

    expect(singleStyle).toBe(singleStyleAgain);
    expect(singleStyle).toEqual({
      styleA: 'moduleA/elementA/styleA',
      styleB: 'moduleA/elementA/styleB',
    });
  });

  it('should merge single class and style properly', () => {
    const fixture = getFixture();
    var style = {styleA: 'overrideA', styleC: 'overrideC'};
    var arrayStyle = flattenStyle([fixture.elementA, style]);

    expect(arrayStyle).toEqual({
      styleA: 'overrideA',
      styleB: 'moduleA/elementA/styleB',
      styleC: 'overrideC',
    });
  });

  it('should merge multiple classes', () => {
    const fixture = getFixture();
    var AthenB = flattenStyle([fixture.elementA, fixture.elementB]);
    var BthenA = flattenStyle([fixture.elementB, fixture.elementA]);

    expect(AthenB).toEqual({
      styleA: 'moduleA/elementA/styleA',
      styleB: 'moduleA/elementB/styleB',
    });
    expect(BthenA).toEqual({
      styleA: 'moduleA/elementA/styleA',
      styleB: 'moduleA/elementA/styleB',
    });
  });

  it('should merge multiple classes with style', () => {
    const fixture = getFixture();
    var style = {styleA: 'overrideA'};
    var AthenB = flattenStyle([fixture.elementA, fixture.elementB, style]);
    var BthenA = flattenStyle([fixture.elementB, fixture.elementA, style]);

    expect(AthenB).toEqual({
      styleA: 'overrideA',
      styleB: 'moduleA/elementB/styleB',
    });
    expect(BthenA).toEqual({
      styleA: 'overrideA',
      styleB: 'moduleA/elementA/styleB',
    });
  });

  it('should flatten recursively', () => {
    const fixture = getFixture();
    var style = [{styleA: 'newA', styleB: 'newB'}, {styleA: 'newA2'}];
    var AthenB = flattenStyle([fixture.elementA, fixture.elementB, style]);

    expect(AthenB).toEqual({
      styleA: 'newA2',
      styleB: 'newB',
    });
  });

  it('should ignore invalid class names', () => {
    var invalid = flattenStyle(1234, null);

    expect(invalid).toEqual(undefined);
    // Invalid class name 1234 skipping ...
  });
});
