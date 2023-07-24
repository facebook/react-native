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

const processTransformOrigin = require('../processTransformOrigin');

describe('processTransformOrigin', () => {
  describe('validation', () => {
    it('only accepts three values', () => {
      expect(() => {
        processTransformOrigin([]);
      }).toThrowErrorMatchingSnapshot();
      expect(() => {
        processTransformOrigin(['50%', '50%']);
      }).toThrowErrorMatchingSnapshot();
    });

    it('should transform a string', () => {
      expect(processTransformOrigin('50% 50% 5px')).toEqual(['50%', '50%', 5]);
    });

    it('should handle one value', () => {
      expect(processTransformOrigin('top')).toEqual(['50%', 0, 0]);
      expect(processTransformOrigin('right')).toEqual(['100%', '50%', 0]);
      expect(processTransformOrigin('bottom')).toEqual(['50%', '100%', 0]);
      expect(processTransformOrigin('left')).toEqual([0, '50%', 0]);
    });

    it('should handle two values', () => {
      expect(processTransformOrigin('30% top')).toEqual(['30%', 0, 0]);
      expect(processTransformOrigin('right 30%')).toEqual(['100%', '30%', 0]);
      expect(processTransformOrigin('30% bottom')).toEqual(['30%', '100%', 0]);
      expect(processTransformOrigin('left 30%')).toEqual([0, '30%', 0]);
    });

    it('should not allow specifying same position twice', () => {
      expect(() => {
        processTransformOrigin('top top');
      }).toThrowErrorMatchingInlineSnapshot();
      expect(() => {
        processTransformOrigin('right right');
      }).toThrowErrorMatchingInlineSnapshot();
      expect(() => {
        processTransformOrigin('bottom bottom');
      }).toThrowErrorMatchingInlineSnapshot();
      expect(() => {
        processTransformOrigin('left left');
      }).toThrowErrorMatchingInlineSnapshot();
      expect(() => {
        processTransformOrigin('top bottom');
      }).toThrowErrorMatchingInlineSnapshot();
      expect(() => {
        processTransformOrigin('left right');
      }).toThrowErrorMatchingInlineSnapshot();
    });

    it('should handle three values', () => {
      expect(processTransformOrigin('30% top 10px')).toEqual(['30%', 0, 10]);
      expect(processTransformOrigin('right 30% 10px')).toEqual([
        '100%',
        '30%',
        10,
      ]);
      expect(processTransformOrigin('30% bottom 10px')).toEqual([
        '30%',
        '100%',
        10,
      ]);
      expect(processTransformOrigin('left 30% 10px')).toEqual([0, '30%', 10]);
    });

    it('should enforce two value ordering', () => {
      expect(() => {
        processTransformOrigin('top 30%');
      }).toThrowErrorMatchingInlineSnapshot();
    });

    it('should not allow percents for z-position', () => {
      expect(() => {
        processTransformOrigin('top 30% 30%');
      }).toThrowErrorMatchingInlineSnapshot();
      expect(() => {
        processTransformOrigin('top 30% center');
      }).toThrowErrorMatchingInlineSnapshot();
    });
  });
});
