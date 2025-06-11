/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import processTransformOrigin from '../processTransformOrigin';

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

    it('should handle two keywords in either order', () => {
      expect(processTransformOrigin('right bottom')).toEqual([
        '100%',
        '100%',
        0,
      ]);
      expect(processTransformOrigin('bottom right')).toEqual([
        '100%',
        '100%',
        0,
      ]);
      expect(processTransformOrigin('right bottom 5px')).toEqual([
        '100%',
        '100%',
        5,
      ]);
      expect(processTransformOrigin('bottom right 5px')).toEqual([
        '100%',
        '100%',
        5,
      ]);
    });

    it('should not allow specifying same position twice', () => {
      expect(() => {
        processTransformOrigin('top top');
      }).toThrowErrorMatchingInlineSnapshot(
        `"Could not parse transform-origin: top top"`,
      );
      expect(() => {
        processTransformOrigin('right right');
      }).toThrowErrorMatchingInlineSnapshot(
        `"Transform-origin right can only be used for x-position"`,
      );
      expect(() => {
        processTransformOrigin('bottom bottom');
      }).toThrowErrorMatchingInlineSnapshot(
        `"Could not parse transform-origin: bottom bottom"`,
      );
      expect(() => {
        processTransformOrigin('left left');
      }).toThrowErrorMatchingInlineSnapshot(
        `"Transform-origin left can only be used for x-position"`,
      );
      expect(() => {
        processTransformOrigin('top bottom');
      }).toThrowErrorMatchingInlineSnapshot(
        `"Could not parse transform-origin: top bottom"`,
      );
      expect(() => {
        processTransformOrigin('left right');
      }).toThrowErrorMatchingInlineSnapshot(
        `"Transform-origin right can only be used for x-position"`,
      );
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
      }).toThrowErrorMatchingInlineSnapshot(
        `"Could not parse transform-origin: top 30%"`,
      );
    });

    it('should not allow percents for z-position', () => {
      expect(() => {
        processTransformOrigin('top 30% 30%');
      }).toThrowErrorMatchingInlineSnapshot(
        `"Could not parse transform-origin: top 30% 30%"`,
      );
      expect(() => {
        processTransformOrigin('top 30% center');
      }).toThrowErrorMatchingInlineSnapshot(
        `"Could not parse transform-origin: top 30% center"`,
      );
    });
  });
});
