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

const {
  emitBoolean,
  emitDouble,
  emitNumber,
  emitInt32,
  emitRootTag,
  typeAliasResolution,
} = require('../parsers-primitives.js');

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

describe('emitNumber', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitNumber(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'NumberTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitNumber(false);
      const expected = {
        type: 'NumberTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitRootTag', () => {
  const reservedTypeAnnotation = {
    type: 'ReservedTypeAnnotation',
    name: 'RootTag',
  };

  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitRootTag(true);

      expect(result).toEqual({
        type: 'NullableTypeAnnotation',
        typeAnnotation: reservedTypeAnnotation,
      });
    });
  });

  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitRootTag(false);

      expect(result).toEqual(reservedTypeAnnotation);
    });
  });
});

describe('emitDouble', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitDouble(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'DoubleTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitDouble(false);
      const expected = {
        type: 'DoubleTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('typeAliasResolution', () => {
  const objectTypeAnnotation = {
    type: 'ObjectTypeAnnotation',
    properties: [
      {
        name: 'Foo',
        optional: false,
        typeAnnotation: {
          type: 'StringTypeAnnotation',
        },
      },
    ],
  };

  describe('when typeAliasResolutionStatus is successful', () => {
    const typeAliasResolutionStatus = {successful: true, aliasName: 'Foo'};

    describe('when nullable is true', () => {
      it('returns nullable TypeAliasTypeAnnotation and map it in aliasMap', () => {
        const aliasMap = {};
        const result = typeAliasResolution(
          typeAliasResolutionStatus,
          objectTypeAnnotation,
          aliasMap,
          true,
        );

        expect(aliasMap).toEqual({Foo: objectTypeAnnotation});
        expect(result).toEqual({
          type: 'NullableTypeAnnotation',
          typeAnnotation: {
            type: 'TypeAliasTypeAnnotation',
            name: 'Foo',
          },
        });
      });
    });

    describe('when nullable is false', () => {
      it('returns non nullable TypeAliasTypeAnnotation and map it in aliasMap', () => {
        const aliasMap = {};
        const result = typeAliasResolution(
          typeAliasResolutionStatus,
          objectTypeAnnotation,
          aliasMap,
          false,
        );

        expect(aliasMap).toEqual({Foo: objectTypeAnnotation});
        expect(result).toEqual({
          type: 'TypeAliasTypeAnnotation',
          name: 'Foo',
        });
      });
    });
  });

  describe('when typeAliasResolutionStatus is not successful', () => {
    const typeAliasResolutionStatus = {successful: false};

    describe('when nullable is true', () => {
      it('returns nullable ObjectTypeAnnotation', () => {
        const aliasMap = {};
        const result = typeAliasResolution(
          typeAliasResolutionStatus,
          objectTypeAnnotation,
          aliasMap,
          true,
        );

        expect(aliasMap).toEqual({});
        expect(result).toEqual({
          type: 'NullableTypeAnnotation',
          typeAnnotation: objectTypeAnnotation,
        });
      });
    });

    describe('when nullable is false', () => {
      it('returns non nullable ObjectTypeAnnotation', () => {
        const aliasMap = {};
        const result = typeAliasResolution(
          typeAliasResolutionStatus,
          objectTypeAnnotation,
          aliasMap,
          false,
        );

        expect(aliasMap).toEqual({});
        expect(result).toEqual(objectTypeAnnotation);
      });
    });
  });
});
