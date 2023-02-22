/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

const processTransform = require('../processTransform');

describe('processTransform', () => {
  describe('validation', () => {
    it('should accept an empty array', () => {
      processTransform([]);
    });

    it('should accept an empty string', () => {
      processTransform('');
    });

    it('should accept a simple valid transform', () => {
      processTransform([
        {scale: 0.5},
        {translateX: 10},
        {translateY: 20},
        {rotate: '10deg'},
      ]);
      processTransform(
        'scale(0.5) translateX(10px) translateY(20px) rotate(10deg)',
      );
    });

    it('should throw on object with multiple properties', () => {
      expect(() =>
        processTransform([{scale: 0.5, translateY: 10}]),
      ).toThrowErrorMatchingSnapshot();
    });

    it('should throw on invalid transform property', () => {
      expect(() =>
        processTransform([{translateW: 10}]),
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        processTransform('translateW(10)'),
      ).toThrowErrorMatchingSnapshot();
    });

    it('should throw when not passing an array to an array prop', () => {
      expect(() =>
        processTransform([{matrix: 'not-a-matrix'}]),
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        processTransform([{translate: 10}]),
      ).toThrowErrorMatchingSnapshot();
    });

    it('should accept a valid matrix', () => {
      processTransform([{matrix: [1, 1, 1, 1, 1, 1, 1, 1, 1]}]);
      processTransform('matrix(1, 1, 1, 1, 1, 1, 1, 1, 1)');
      processTransform([
        {matrix: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]},
      ]);
      processTransform(
        'matrix(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)',
      );
    });

    it('should throw when passing a matrix of the wrong size', () => {
      expect(() =>
        processTransform([{matrix: [1, 1, 1, 1]}]),
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        processTransform('matrix(1, 1, 1, 1)'),
      ).toThrowErrorMatchingSnapshot();
    });

    it('should accept a valid translate', () => {
      processTransform([{translate: [1, 1]}]);
      processTransform('translate(1px)');
      processTransform('translate(1px, 1px)');
      processTransform([{translate: [1, 1, 1]}]);
    });

    it('should throw when passing a translate of the wrong size', () => {
      expect(() =>
        processTransform([{translate: [1]}]),
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        processTransform([{translate: [1, 1, 1, 1]}]),
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        processTransform('translate(1px, 1px, 1px, 1px)'),
      ).toThrowErrorMatchingSnapshot();
    });

    it('should throw when passing an invalid value to a number prop', () => {
      expect(() =>
        processTransform([{translateY: '20deg'}]),
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        processTransform([{scale: {x: 10, y: 10}}]),
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        processTransform([{perspective: []}]),
      ).toThrowErrorMatchingSnapshot();
    });

    it('should throw when passing a perspective of 0', () => {
      expect(() =>
        processTransform([{perspective: 0}]),
      ).toThrowErrorMatchingSnapshot();
    });

    it('should accept an angle in degrees or radians', () => {
      processTransform([{skewY: '10deg'}]);
      processTransform('skewY(10deg)');
      processTransform([{rotateX: '1.16rad'}]);
      processTransform('rotateX(1.16rad)');
    });

    it('should throw when passing an invalid angle prop', () => {
      expect(() =>
        processTransform([{rotate: 10}]),
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        processTransform('rotate(10)'),
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        processTransform([{skewX: '10drg'}]),
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        processTransform('skewX(10drg)'),
      ).toThrowErrorMatchingSnapshot();
    });

    it('should throw when passing an Animated.Value', () => {
      expect(() =>
        processTransform([{rotate: {getValue: () => {}}}]),
      ).toThrowErrorMatchingSnapshot();
    });
  });
});
