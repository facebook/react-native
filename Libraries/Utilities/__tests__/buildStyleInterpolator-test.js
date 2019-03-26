/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const buildStyleInterpolator = require('buildStyleInterpolator');

const validateEmpty = function(interpolator, value, validator) {
  const emptyObject = {};
  let changed = interpolator(emptyObject, value);
  validator(emptyObject);
  expect(changed).toBe(true);
  changed = interpolator(emptyObject, value);
  expect(changed).toBe(false);
};
describe('buildStyleInterpolator', function() {
  it('should linearly interpolate without extrapolating', function() {
    const testAnim = {
      opacity: {
        from: 100,
        to: 200,
        min: 0,
        max: 1,
        type: 'linear',
        extrapolate: false,
      },
      left: {
        from: 200,
        to: 300,
        min: 0,
        max: 1,
        type: 'linear',
        extrapolate: false,
      },
      top: {
        type: 'constant',
        value: 23.5,
      },
    };
    const interpolator = buildStyleInterpolator(testAnim);
    validateEmpty(interpolator, 0, function(res) {
      expect(res).toEqual({
        opacity: 100,
        left: 200,
        top: 23.5,
      });
    });
    validateEmpty(interpolator, 1, function(res) {
      expect(res).toEqual({
        opacity: 200,
        left: 300,
        top: 23.5,
      });
    });
    validateEmpty(interpolator, -0.1, function(res) {
      expect(res).toEqual({
        opacity: 100,
        left: 200,
        top: 23.5,
      });
    });
    validateEmpty(interpolator, 1.1, function(res) {
      expect(res).toEqual({
        opacity: 200,
        left: 300,
        top: 23.5,
      });
    });
    validateEmpty(interpolator, 0.5, function(res) {
      expect(res).toEqual({
        opacity: 150,
        left: 250,
        top: 23.5,
      });
    });
  });
  it('should linearly interpolate with extrapolating', function() {
    const testAnim = {
      opacity: {
        from: 100,
        to: 200,
        min: 0,
        max: 1,
        type: 'linear',
        round: 1, // To make testing easier
        extrapolate: true,
      },
      left: {
        from: 200,
        to: 300,
        min: 0,
        max: 1,
        type: 'linear',
        round: 1, // To make testing easier
        extrapolate: true,
      },
      top: {
        type: 'constant',
        value: 23.5,
      },
    };
    const interpolator = buildStyleInterpolator(testAnim);
    validateEmpty(interpolator, 0, function(res) {
      expect(res).toEqual({
        opacity: 100,
        left: 200,
        top: 23.5,
      });
    });
    validateEmpty(interpolator, 1, function(res) {
      expect(res).toEqual({
        opacity: 200,
        left: 300,
        top: 23.5,
      });
    });
    validateEmpty(interpolator, -0.1, function(res) {
      expect(res).toEqual({
        opacity: 90,
        left: 190,
        top: 23.5,
      });
    });
    validateEmpty(interpolator, 1.1, function(res) {
      expect(res).toEqual({
        opacity: 210,
        left: 310,
        top: 23.5,
      });
    });
    validateEmpty(interpolator, 0.5, function(res) {
      expect(res).toEqual({
        opacity: 150,
        left: 250,
        top: 23.5,
      });
    });
  });
  it('should round accordingly', function() {
    const testAnim = {
      opacity: {
        from: 0,
        to: 1,
        min: 0,
        max: 1,
        type: 'linear',
        round: 2, // As in one over two
        extrapolate: true,
      },
    };
    const interpolator = buildStyleInterpolator(testAnim);
    validateEmpty(interpolator, 0, function(res) {
      expect(res).toEqual({
        opacity: 0,
      });
    });
    validateEmpty(interpolator, 0.5, function(res) {
      expect(res).toEqual({
        opacity: 0.5,
      });
    });
    validateEmpty(interpolator, 0.4, function(res) {
      expect(res).toEqual({
        opacity: 0.5,
      });
    });
    validateEmpty(interpolator, 0.26, function(res) {
      expect(res).toEqual({
        opacity: 0.5,
      });
    });
    validateEmpty(interpolator, 0.74, function(res) {
      expect(res).toEqual({
        opacity: 0.5,
      });
    });
    validateEmpty(interpolator, 0.76, function(res) {
      expect(res).toEqual({
        opacity: 1.0,
      });
    });
  });
  it('should detect chnages correctly', function() {
    const testAnim = {
      opacity: {
        from: 0,
        to: 1,
        min: 0,
        max: 1,
        type: 'linear',
        round: 2, // As in one over two
        extrapolate: false,
      },
    };
    const interpolator = buildStyleInterpolator(testAnim);
    const obj = {};
    let res = interpolator(obj, 0);
    expect(obj).toEqual({
      opacity: 0,
    });
    expect(res).toBe(true);

    res = interpolator(obj, 0);
    // No change detected
    expect(obj).toEqual({
      opacity: 0,
    });
    expect(res).toBe(false);

    // No change detected
    res = interpolator(obj, 1);
    expect(obj).toEqual({
      opacity: 1,
    });
    expect(res).toBe(true);

    // Still no change detected even when clipping
    res = interpolator(obj, 1);
    expect(obj).toEqual({
      opacity: 1,
    });
    expect(res).toBe(false);
  });
  it('should handle identity', function() {
    const testAnim = {
      opacity: {
        type: 'identity',
      },
    };
    const interpolator = buildStyleInterpolator(testAnim);
    const obj = {};
    let res = interpolator(obj, 0.5);
    expect(obj).toEqual({
      opacity: 0.5,
    });
    expect(res).toBe(true);

    res = interpolator(obj, 0.5);
    // No change detected
    expect(obj).toEqual({
      opacity: 0.5,
    });
    expect(res).toBe(false);
  });
  it('should translate', function() {
    const testAnim = {
      transformTranslate: {
        from: {x: 1, y: 10, z: 100},
        to: {x: 5, y: 50, z: 500},
        min: 0,
        max: 4,
        type: 'linear',
      },
    };
    const interpolator = buildStyleInterpolator(testAnim);
    const obj = {};
    const res = interpolator(obj, 1);
    expect(obj).toEqual({
      transform: [
        {
          matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 20, 200, 1],
        },
      ],
    });
    expect(res).toBe(true);
  });
  it('should scale', function() {
    const testAnim = {
      transformScale: {
        from: {x: 1, y: 10, z: 100},
        to: {x: 5, y: 50, z: 500},
        min: 0,
        max: 4,
        type: 'linear',
      },
    };
    const interpolator = buildStyleInterpolator(testAnim);
    const obj = {};
    const res = interpolator(obj, 1);
    expect(obj).toEqual({
      transform: [
        {
          matrix: [2, 0, 0, 0, 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 1],
        },
      ],
    });
    expect(res).toBe(true);
  });
  it('should combine scale and translate', function() {
    const testAnim = {
      transformScale: {
        from: {x: 1, y: 10, z: 100},
        to: {x: 5, y: 50, z: 500},
        min: 0,
        max: 4,
        type: 'linear',
      },
      transformTranslate: {
        from: {x: 1, y: 10, z: 100},
        to: {x: 5, y: 50, z: 500},
        min: 0,
        max: 4,
        type: 'linear',
      },
    };
    const interpolator = buildStyleInterpolator(testAnim);
    const obj = {};
    const res = interpolator(obj, 1);
    expect(obj).toEqual({
      transform: [
        {
          matrix: [2, 0, 0, 0, 0, 20, 0, 0, 0, 0, 200, 0, 4, 400, 40000, 1],
        },
      ],
    });
    expect(res).toBe(true);
  });
  it('should step', function() {
    const testAnim = {
      opacity: {
        threshold: 13,
        from: 10,
        to: 20,
        type: 'step',
      },
    };
    const interpolator = buildStyleInterpolator(testAnim);
    const obj = {};
    let res = interpolator(obj, 0);
    expect(obj).toEqual({
      opacity: 10,
    });
    expect(res).toBe(true);

    res = interpolator(obj, 0);
    // No change detected
    expect(obj).toEqual({
      opacity: 10,
    });
    expect(res).toBe(false);

    // No change detected
    res = interpolator(obj, 10);
    expect(obj).toEqual({
      opacity: 10,
    });
    expect(res).toBe(false);

    // No change detected
    res = interpolator(obj, 12);
    expect(obj).toEqual({
      opacity: 10,
    });
    expect(res).toBe(false);

    // No change detected
    res = interpolator(obj, 13);
    expect(obj).toEqual({
      opacity: 20,
    });
    expect(res).toBe(true);

    // No change detected
    res = interpolator(obj, 13.1);
    expect(obj).toEqual({
      opacity: 20,
    });
    expect(res).toBe(false);

    // No change detected
    res = interpolator(obj, 25);
    expect(obj).toEqual({
      opacity: 20,
    });
    expect(res).toBe(false);
  });
});
