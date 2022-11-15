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
  emitFloat,
  emitNumber,
  emitInt32,
  emitObject,
  emitPromise,
  emitRootTag,
  emitVoid,
  emitString,
  emitStringish,
  emitMixedTypeAnnotation,
  typeAliasResolution,
} = require('../parsers-primitives.js');
import {MockedParser} from '../parserMock';

const parser = new MockedParser();

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

describe('emitStringish', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitStringish(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'StringTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });

  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitStringish(false);
      const expected = {
        type: 'StringTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('emitString', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitString(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'StringTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });

  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitString(false);
      const expected = {
        type: 'StringTypeAnnotation',
      };

      expect(result).toEqual(expected);
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

describe('emitVoid', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitVoid(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'VoidTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitVoid(false);
      const expected = {
        type: 'VoidTypeAnnotation',
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

describe('emitPromise', () => {
  const moduleName = 'testModuleName';

  function emitPromiseForUnitTest(
    typeAnnotation: $FlowFixMe,
    nullable: boolean,
  ): $FlowFixMe {
    return emitPromise(
      moduleName,
      typeAnnotation,
      parser,
      nullable,
      // mock translateTypeAnnotation function
      /* types: TypeDeclarationMap */
      {},
      /* aliasMap: {...NativeModuleAliasMap} */
      {},
      /* tryParse: ParserErrorCapturer */
      function <T>(_: () => T) {
        return null;
      },
      /* cxxOnly: boolean */
      false,
      /* the translateTypeAnnotation function */
      (_, elementType) => elementType,
    );
  }

  describe("when typeAnnotation doesn't have exactly one typeParameter", () => {
    const typeAnnotation = {
      typeParameters: {
        params: [1, 2],
        type: 'TypeParameterInstantiation',
      },
      id: {
        name: 'typeAnnotationName',
      },
    };
    it('throws an IncorrectlyParameterizedGenericParserError error', () => {
      const nullable = false;
      expect(() => emitPromiseForUnitTest(typeAnnotation, nullable)).toThrow();
    });
  });

  describe("when typeAnnotation doesn't has exactly one typeParameter", () => {
    const typeAnnotation = {
      typeParameters: {
        params: [1],
        type: 'TypeParameterInstantiation',
      },
      id: {
        name: 'typeAnnotationName',
      },
    };

    describe('when nullable is true', () => {
      const nullable = true;
      it('returns nullable type annotation', () => {
        const result = emitPromiseForUnitTest(typeAnnotation, nullable);
        const expected = {
          type: 'NullableTypeAnnotation',
          typeAnnotation: {
            type: 'PromiseTypeAnnotation',
            elementType: 1,
          },
        };

        expect(result).toEqual(expected);
      });
    });
    describe('when nullable is false', () => {
      const nullable = false;
      it('returns non nullable type annotation', () => {
        const result = emitPromiseForUnitTest(typeAnnotation, nullable);
        const expected = {
          type: 'PromiseTypeAnnotation',
          elementType: 1,
        };

        expect(result).toEqual(expected);
      });
    });
  });
});

describe('emitObject', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitObject(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'GenericObjectTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitObject(false);
      const expected = {
        type: 'GenericObjectTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });

  describe('emitFloat', () => {
    describe('when nullable is true', () => {
      it('returns nullable type annotation', () => {
        const result = emitFloat(true);
        const expected = {
          type: 'NullableTypeAnnotation',
          typeAnnotation: {
            type: 'FloatTypeAnnotation',
          },
        };

        expect(result).toEqual(expected);
      });
    });
    describe('when nullable is false', () => {
      it('returns non nullable type annotation', () => {
        const result = emitFloat(false);
        const expected = {
          type: 'FloatTypeAnnotation',
        };

        expect(result).toEqual(expected);
      });
    });
  });
});

describe('emitMixedTypeAnnotation', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitMixedTypeAnnotation(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'MixedTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitMixedTypeAnnotation(false);
      const expected = {
        type: 'MixedTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});
