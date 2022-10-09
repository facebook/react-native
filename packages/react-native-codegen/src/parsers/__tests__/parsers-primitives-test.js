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

const {emitBoolean, emitInt32} = require('../parsers-primitives.js');

describe('emitBoolean', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitBoolean(true);
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
      const result = emitBoolean(false);
      const expected = {
        type: 'BooleanTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitInt32', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitInt32(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'Int32TypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitInt32(false);
      const expected = {
        type: 'Int32TypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});
