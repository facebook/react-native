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

'use-strict';

const {wrapNullable, unwrapNullable} = require('../parsers-commons.js');

describe('wrapNullable', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = wrapNullable(true, {
        type: 'BooleanTypeAnnotation',
      });
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'BooleanTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = wrapNullable(false, {
        type: 'BooleanTypeAnnotation',
      });
      const expected = {
        type: 'BooleanTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('unwrapNullable', () => {
  describe('when type annotation is nullable', () => {
    it('returns original type annotation', () => {
      const result = unwrapNullable({
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'BooleanTypeAnnotation',
        },
      });
      const expected = [
        {
          type: 'BooleanTypeAnnotation',
        },
        true,
      ];

      expect(result).toEqual(expected);
    });
  });
  describe('when type annotation is not nullable', () => {
    it('returns original type annotation', () => {
      const result = unwrapNullable({
        type: 'BooleanTypeAnnotation',
      });
      const expected = [
        {
          type: 'BooleanTypeAnnotation',
        },
        false,
      ];

      expect(result).toEqual(expected);
    });
  });
});
