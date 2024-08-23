/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 * @flow strict-local
 */

'use strict';

import type {FilterPrimitive} from '../processFilter';

const processFilter = require('../processFilter').default;

// js1 test processFilter
describe('processFilter', () => {
  testStandardFilter('brightness');
  testStandardFilter('opacity');
  testStandardFilter('contrast');
  testStandardFilter('saturate');
  testStandardFilter('grayscale');
  testStandardFilter('sepia');
  testStandardFilter('invert');

  testNumericFilter('blur', 5, [
    {
      blur: 5,
    },
  ]);
  testNumericFilter('blur', -5, []);
  testUnitFilter('blur', 5, '%', []);
  testUnitFilter('blur', 5, 'px', [
    {
      blur: 5,
    },
  ]);

  testNumericFilter('hueRotate', 0, [{hueRotate: 0}]);
  testUnitFilter('hueRotate', 90, 'deg', [{hueRotate: 90}]);
  testUnitFilter('hueRotate', 1.5708, 'rad', [
    {hueRotate: (180 * 1.5708) / Math.PI},
  ]);
  testUnitFilter('hueRotate', -90, 'deg', [{hueRotate: -90}]);
  testUnitFilter('hueRotate', 1.5, 'grad', []);
  testNumericFilter('hueRotate', 90, []);
  testUnitFilter('hueRotate', 50, '%', []);

  it('multiple filters', () => {
    expect(
      processFilter([
        {brightness: 0.5},
        {opacity: 0.5},
        {blur: 5},
        {hueRotate: '90deg'},
      ]),
    ).toEqual([{brightness: 0.5}, {opacity: 0.5}, {blur: 5}, {hueRotate: 90}]);
  });
  it('multiple filters one invalid', () => {
    expect(
      processFilter([
        {brightness: 0.5},
        {opacity: 0.5},
        {blur: 5},
        {hueRotate: '90foo'},
      ]),
    ).toEqual([]);
  });
  it('multiple same filters', () => {
    expect(
      processFilter([
        {brightness: 0.5},
        {brightness: 0.5},
        {brightness: 0.5},
        {brightness: 0.5},
      ]),
    ).toEqual([
      {brightness: 0.5},
      {brightness: 0.5},
      {brightness: 0.5},
      {brightness: 0.5},
    ]);
  });
  it('empty', () => {
    expect(processFilter([])).toEqual([]);
  });
  it('Non filter', () => {
    // $FlowExpectedError[incompatible-call]
    expect(processFilter([{foo: 5}])).toEqual([]);
  });
  it('Invalid amount type', () => {
    // $FlowExpectedError[incompatible-call]
    expect(processFilter([{brightness: {}}])).toEqual([]);
  });
  it('string multiple filters', () => {
    expect(
      processFilter('brightness(0.5) opacity(0.5) blur(5) hueRotate(90deg)'),
    ).toEqual([{brightness: 0.5}, {opacity: 0.5}, {blur: 5}, {hueRotate: 90}]);
  });
  it('string multiple filters one invalid', () => {
    expect(
      processFilter('brightness(0.5) opacity(0.5) blur(5) hueRotate(90foo)'),
    ).toEqual([]);
  });
  it('string multiple same filters', () => {
    expect(
      processFilter(
        'brightness(0.5) brightness(0.5) brightness(0.5) brightness(0.5)',
      ),
    ).toEqual([
      {brightness: 0.5},
      {brightness: 0.5},
      {brightness: 0.5},
      {brightness: 0.5},
    ]);
  });
  it('string empty', () => {
    expect(processFilter('')).toEqual([]);
  });
  it('string non filter', () => {
    // $FlowExpectedError[incompatible-call]
    expect(processFilter('foo: 5')).toEqual([]);
  });
  it('string invalid amount type', () => {
    // $FlowExpectedError[incompatible-call]
    expect(processFilter('brightness: {}')).toEqual([]);
  });
  it('string brightness(.5)', () => {
    // $FlowExpectedError[incompatible-call]
    expect(processFilter('brightness(.5)')).toEqual([{brightness: 0.5}]);
  });
});

function testStandardFilter(filter: string): void {
  const value = 0.5;
  const expected = createFilterPrimitive(filter, value);
  const percentExpected = createFilterPrimitive(filter, value / 100);

  testNumericFilter(filter, value, [expected]);
  testNumericFilter(filter, -value, []);
  testUnitFilter(filter, value, 'px', [expected]);
  testUnitFilter(filter, value, '%', [percentExpected]);
}

function testNumericFilter(
  filter: string,
  value: number,
  expected: Array<FilterPrimitive>,
): void {
  const filterObject = createFilterPrimitive(filter, value);
  const filterString = filter + '(' + value.toString() + ')';

  it(filterString, () => {
    expect(processFilter([filterObject])).toEqual(expected);
  });
  it('string ' + filterString, () => {
    expect(processFilter(filterString)).toEqual(expected);
  });
}

function testUnitFilter(
  filter: string,
  value: number,
  unit: string,
  expected: Array<FilterPrimitive>,
): void {
  const unitAmount = value + unit;
  const filterObject = createFilterPrimitive(filter, unitAmount);
  const filterString = filter + '(' + unitAmount + ')';

  it(filterString, () => {
    expect(processFilter([filterObject])).toEqual(expected);
  });
  it('string ' + filterString, () => {
    expect(processFilter(filterString)).toEqual(expected);
  });
}

function createFilterPrimitive(
  filter: string,
  value: number | string,
): FilterPrimitive {
  switch (filter) {
    case 'brightness':
      return {brightness: value};
    case 'blur':
      return {blur: value};
    case 'contrast':
      return {contrast: value};
    case 'grayscale':
      return {grayscale: value};
    case 'hueRotate':
      return {hueRotate: value};
    case 'invert':
      return {invert: value};
    case 'opacity':
      return {opacity: value};
    case 'saturate':
      return {saturate: value};
    case 'sepia':
      return {sepia: value};
    default:
      throw new Error('Invalid filter: ' + filter);
  }
}
