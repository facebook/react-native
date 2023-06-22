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
  UnsupportedObjectPropertyTypeAnnotationParserError,
} = require('../errors');

import {TypeScriptParser} from '../typescript/parser';
import {FlowParser} from '../flow/parser';

const hasteModuleName = 'moduleName';
describe('FlowParser', () => {
  const parser = new FlowParser();
  describe('getKeyName', () => {
    describe('when propertyOrIndex is ObjectTypeProperty', () => {
      test('returns property name', () => {
        const property = {
          type: 'ObjectTypeProperty',
          key: {
            name: 'propertyName',
          },
        };

        const expected = 'propertyName';

        expect(parser.getKeyName(property, hasteModuleName)).toEqual(expected);
      });
    });

    describe('when propertyOrIndex is not ObjectTypeProperty or ObjectTypeIndexer', () => {
      test('throw UnsupportedObjectPropertyTypeAnnotationParserError', () => {
        const indexer = {
          type: 'EnumDeclaration',
          memberType: 'NumberTypeAnnotation',
        };

        expect(() => parser.getKeyName(indexer, hasteModuleName)).toThrowError(
          UnsupportedObjectPropertyTypeAnnotationParserError,
        );
      });
    });
  });

  describe('remapUnionTypeAnnotationMemberNames', () => {
    test('returns remaped union annotation member types without duplicates', () => {
      const membersType = [
        {type: 'NumberLiteralTypeAnnotation'},
        {type: 'ObjectTypeAnnotation'},
        {type: 'StringLiteralTypeAnnotation'},
        {type: 'ObjectTypeAnnotation'},
      ];

      expect(parser.remapUnionTypeAnnotationMemberNames(membersType)).toEqual([
        'NumberTypeAnnotation',
        'ObjectTypeAnnotation',
        'StringTypeAnnotation',
      ]);
    });
  });

  describe('isModuleInterface', () => {
    test('returns true if it is a valid node', () => {
      const node = {
        type: 'InterfaceDeclaration',
        extends: [
          {
            type: 'InterfaceExtends',
            id: {
              name: 'TurboModule',
            },
          },
        ],
      };
      expect(parser.isModuleInterface(node)).toBe(true);
    });

    test('returns false if it is a invalid node', () => {
      const node = {};
      expect(parser.isModuleInterface(node)).toBe(false);
    });
  });

  describe('isGenericTypeAnnotation', () => {
    test('returns true if it is a generic type annotation', () => {
      expect(parser.isGenericTypeAnnotation('GenericTypeAnnotation')).toBe(
        true,
      );
    });

    test('returns false if it is not a generic type annotation', () => {
      expect(parser.isGenericTypeAnnotation('StringTypeAnnotation')).toBe(
        false,
      );
    });
  });

  describe('callExpressionTypeParameters', () => {
    test('returns type arguments if it is a valid node', () => {
      const node = {
        type: 'CallExpression',
        typeArguments: {
          type: 'TypeParameterInstantiation',
          params: [],
        },
      };
      expect(parser.callExpressionTypeParameters(node)).toEqual({
        type: 'TypeParameterInstantiation',
        params: [],
      });
    });

    test('returns null if it is a invalid node', () => {
      const node = {};
      expect(parser.callExpressionTypeParameters(node)).toBe(null);
    });
  });

  describe('computePartialProperties', () => {
    test('returns partial properties', () => {
      const properties = [
        {
          type: 'ObjectTypeProperty',
          key: {
            type: 'Identifier',
            name: 'a',
          },
          value: {
            type: 'StringTypeAnnotation',
            range: [],
          },
        },
        {
          type: 'ObjectTypeProperty',
          key: {
            type: 'Identifier',
            name: 'b',
          },
          optional: true,
          value: {
            type: 'BooleanTypeAnnotation',
            range: [],
          },
        },
      ];

      const expected = [
        {
          name: 'a',
          optional: true,
          typeAnnotation: {type: 'StringTypeAnnotation'},
        },
        {
          name: 'b',
          optional: true,
          typeAnnotation: {type: 'BooleanTypeAnnotation'},
        },
      ];

      expect(
        parser.computePartialProperties(
          properties,
          'hasteModuleName',
          {},
          {},
          {},
          () => null,
          false,
        ),
      ).toEqual(expected);
    });
  });

  describe('getTypeArgumentParamsFromDeclaration', () => {
    test('returns type arguments params from declaration', () => {
      const declaration = {
        type: 'TypeAlias',
        typeArguments: {
          type: 'TypeParameterDeclaration',
          params: [
            {
              type: 'TypeParameter',
              name: 'T',
            },
          ],
        },
      };

      const expected = [
        {
          type: 'TypeParameter',
          name: 'T',
        },
      ];

      expect(parser.getTypeArgumentParamsFromDeclaration(declaration)).toEqual(
        expected,
      );
    });

    test('returns undefined if declaration type argument params is Invalid', () => {
      const declaration = {
        type: 'TypeAlias',
        typeArguments: {
          type: 'TypeParameterDeclaration',
        },
      };

      expect(parser.getTypeArgumentParamsFromDeclaration(declaration)).toEqual(
        undefined,
      );
    });
  });

  describe('getNativeComponentType', () => {
    test('returns native component type when typeArgumentParams & funcArgumentParams are valid', () => {
      const typeArgumentParams = [
        {
          type: 'TypeParameter',
          name: 'T',
          id: {
            name: 'T',
          },
        },
      ];

      const funcArgumentParams = [
        {
          type: 'StringLiteral',
          value: 'componentName',
        },
      ];

      const expected = {
        propsTypeName: 'T' /* typeArgumentParams[0].id.name */,
        componentName: 'componentName' /* funcArgumentParams[0].value */,
      };

      expect(
        parser.getNativeComponentType(typeArgumentParams, funcArgumentParams),
      ).toEqual(expected);
    });

    test('returns undefined when typeArgumentParams & funcArgumentParams are invalid', () => {
      const typeArgumentParams = [
        {
          type: 'TypeParameter',
          name: 'T',
          id: {},
        },
      ];
      const funcArgumentParams = [{}];

      const expected = {
        propsTypeName: undefined /* typeArgumentParams[0].id.name */,
        componentName: undefined /* funcArgumentParams[0].value */,
      };

      expect(
        parser.getNativeComponentType(typeArgumentParams, funcArgumentParams),
      ).toEqual(expected);
    });
  });

  describe('isOptionalProperty', () => {
    test('when property is optional', () => {
      const property = {
        value: {
          type: 'TypeAnnotation',
        },
        optional: true,
      };

      expect(parser.isOptionalProperty(property)).toEqual(true);
    });

    test('when property is not optional', () => {
      const property = {
        value: {
          type: 'TypeAnnotation',
        },
        optional: false,
      };

      expect(parser.isOptionalProperty(property)).toEqual(false);
    });

    test('when property value type is NullableTypeAnnotation', () => {
      const property = {
        value: {
          type: 'NullableTypeAnnotation',
        },
        optional: false,
      };

      expect(parser.isOptionalProperty(property)).toEqual(true);
    });
  });

  describe('getTypeAnnotationFromProperty', () => {
    describe('when property value type is NullableTypeAnnotation', () => {
      test('returns typeAnnotation of the value', () => {
        const typeAnnotation = {
          type: 'StringTypeAnnotation',
        };

        const property = {
          value: {
            type: 'NullableTypeAnnotation',
            typeAnnotation: typeAnnotation,
          },
        };

        expect(parser.getTypeAnnotationFromProperty(property)).toEqual(
          typeAnnotation,
        );
      });
    });

    describe('when property value type is not NullableTypeAnnotation', () => {
      test('returns the value', () => {
        const value = {
          type: 'StringTypeAnnotation',
        };

        const property = {
          value: value,
        };

        expect(parser.getTypeAnnotationFromProperty(property)).toEqual(value);
      });
    });
  });

  describe('typeAlias', () => {
    test('returns typeAlias Property', () => {
      expect(parser.typeAlias).toEqual('TypeAlias');
    });
  });

  describe('enumDeclaration', () => {
    test('returns enumDeclaration Property', () => {
      expect(parser.enumDeclaration).toEqual('EnumDeclaration');
    });
  });

  describe('interfaceDeclaration', () => {
    test('returns interfaceDeclaration Property', () => {
      expect(parser.interfaceDeclaration).toEqual('InterfaceDeclaration');
    });
  });

  describe('extractTypeFromTypeAnnotation', () => {
    test('should return the name if typeAnnotation is GenericTypeAnnotation', () => {
      const typeAnnotation = {
        type: 'GenericTypeAnnotation',
        id: {
          name: 'SomeType',
        },
      };

      expect(parser.extractTypeFromTypeAnnotation(typeAnnotation)).toEqual(
        'SomeType',
      );
    });

    test('should return the type if typeAnnotation is not GenericTypeAnnotation', () => {
      const typeAnnotation = {
        type: 'SomeOtherType',
      };

      expect(parser.extractTypeFromTypeAnnotation(typeAnnotation)).toEqual(
        'SomeOtherType',
      );
    });
  });

  describe('getObjectProperties', () => {
    test('returns properties of an object represented by a type annotation', () => {
      const properties = [
        {
          type: 'ObjectTypeProperty',
          key: {
            type: 'Identifier',
            name: 'a',
          },
          value: {
            type: 'StringTypeAnnotation',
            range: [],
          },
        },
        {
          type: 'ObjectTypeProperty',
          key: {
            type: 'Identifier',
            name: 'b',
          },
          optional: true,
          value: {
            type: 'BooleanTypeAnnotation',
            range: [],
          },
        },
      ];

      const typeAnnotation = {
        type: 'TypeAlias',
        properties: properties,
      };

      const expected = properties;

      expect(parser.getObjectProperties(typeAnnotation)).toEqual(expected);
    });

    test('returns undefined if typeAnnotation does not have properties', () => {
      const declaration = {
        type: 'TypeAlias',
      };

      expect(parser.getObjectProperties(declaration)).toEqual(undefined);
    });
  });
});

describe('TypeScriptParser', () => {
  const parser = new TypeScriptParser();
  describe('getKeyName', () => {
    describe('when propertyOrIndex is TSPropertySignature', () => {
      test('returns property name', () => {
        const property = {
          type: 'TSPropertySignature',
          key: {
            name: 'propertyName',
          },
        };

        const expected = 'propertyName';

        expect(parser.getKeyName(property, hasteModuleName)).toEqual(expected);
      });
    });

    describe('when propertyOrIndex is not TSPropertySignature or TSIndexSignature', () => {
      test('throw UnsupportedObjectPropertyTypeAnnotationParserError', () => {
        const indexer = {
          type: 'TSEnumDeclaration',
          memberType: 'NumberTypeAnnotation',
        };

        expect(() => parser.getKeyName(indexer, hasteModuleName)).toThrowError(
          UnsupportedObjectPropertyTypeAnnotationParserError,
        );
      });
    });
  });
  describe('remapUnionTypeAnnotationMemberNames', () => {
    test('returns remaped union annotation member types without duplicates', () => {
      const membersType = [
        {literal: {type: 'NumericLiteral'}},
        {type: 'ObjectTypeAnnotation'},
        {literal: {type: 'StringLiteral'}},
        {type: 'ObjectTypeAnnotation'},
      ];

      expect(parser.remapUnionTypeAnnotationMemberNames(membersType)).toEqual([
        'NumberTypeAnnotation',
        'ObjectTypeAnnotation',
        'StringTypeAnnotation',
      ]);
    });
  });

  describe('isModuleInterface', () => {
    test('returns true if it is a valid node', () => {
      const node = {
        type: 'TSInterfaceDeclaration',
        extends: [
          {
            type: 'TSExpressionWithTypeArguments',
            expression: {
              name: 'TurboModule',
            },
          },
        ],
      };
      expect(parser.isModuleInterface(node)).toBe(true);
    });

    test('returns false if it is a invalid node', () => {
      const node = {};
      expect(parser.isModuleInterface(node)).toBe(false);
    });
  });

  describe('isGenericTypeAnnotation', () => {
    test('returns true if it is a generic type annotation', () => {
      expect(parser.isGenericTypeAnnotation('TSTypeReference')).toBe(true);
    });

    test('returns false if it is not a generic type annotation', () => {
      expect(parser.isGenericTypeAnnotation('StringTypeAnnotation')).toBe(
        false,
      );
    });
  });

  describe('callExpressionTypeParameters', () => {
    test('returns type parameters if it is a valid node', () => {
      const node = {
        type: 'CallExpression',
        typeParameters: {
          type: 'TypeParameterInstantiation',
          params: [],
        },
      };
      expect(parser.callExpressionTypeParameters(node)).toEqual({
        type: 'TypeParameterInstantiation',
        params: [],
      });
    });

    test('returns null if it is a invalid node', () => {
      const node = {};
      expect(parser.callExpressionTypeParameters(node)).toBe(null);
    });
  });

  describe('computePartialProperties', () => {
    test('returns partial properties', () => {
      const properties = [
        {
          type: 'TSPropertySignature',
          key: {
            type: 'Identifier',
            name: 'a',
          },
          typeAnnotation: {
            type: 'TSTypeAnnotation',
            typeAnnotation: {
              type: 'TSTypeLiteral',
              key: {
                type: 'Identifier',
                name: 'a',
              },
              members: [],
            },
          },
        },
        {
          type: 'TSPropertySignature',
          key: {
            type: 'Identifier',
            name: 'b',
          },
          optional: true,
          typeAnnotation: {
            type: 'TSTypeAnnotation',
            typeAnnotation: {
              type: 'TSStringKeyword',
              key: {
                type: 'Identifier',
                name: 'b',
              },
              members: [],
            },
          },
        },
      ];

      const expected = [
        {
          name: 'a',
          optional: true,
          typeAnnotation: {properties: [], type: 'ObjectTypeAnnotation'},
        },
        {
          name: 'b',
          optional: true,
          typeAnnotation: {type: 'StringTypeAnnotation'},
        },
      ];

      expect(
        parser.computePartialProperties(
          properties,
          'hasteModuleName',
          {},
          {},
          {},
          () => null,
          false,
        ),
      ).toEqual(expected);
    });
  });

  describe('getTypeArgumentParamsFromDeclaration', () => {
    test('returns type argument params from declaration', () => {
      const declaration = {
        type: 'TypeAlias',
        typeParameters: {
          type: 'TypeParameterDeclaration',
          params: [
            {
              type: 'TypeParameter',
              name: 'T',
            },
          ],
        },
      };

      const expected = [
        {
          type: 'TypeParameter',
          name: 'T',
        },
      ];

      expect(parser.getTypeArgumentParamsFromDeclaration(declaration)).toEqual(
        expected,
      );
    });

    test('returns undefined if declaration type arguments params is Invalid', () => {
      const declaration = {
        type: 'TypeAlias',
        typeParameters: {},
      };

      expect(parser.getTypeArgumentParamsFromDeclaration(declaration)).toEqual(
        undefined,
      );
    });
  });

  describe('getNativeComponentType', () => {
    test('returns native component type when typeArgumentParams & funcArgumentParams are valid', () => {
      const typeArgumentParams = [
        {
          typeName: {
            type: 'Identifier',
            name: 'T',
          },
        },
      ];

      const funcArgumentParams = [
        {
          type: 'ObjectTypeAnnotation',
          value: 'StringTypeAnnotation',
        },
      ];

      const expected = {
        propsTypeName: 'T' /* typeArgumentParams[0].typeName.name */,
        componentName: 'StringTypeAnnotation' /* funcArgumentParams[0].value */,
      };

      expect(
        parser.getNativeComponentType(typeArgumentParams, funcArgumentParams),
      ).toEqual(expected);
    });

    test('returns undefined when typeArgumentParams & funcArgumentParams are invalid', () => {
      const typeArgumentParams = [
        {
          typeName: {
            type: 'Invalid',
          },
        },
      ];
      const funcArgumentParams = [{}];

      const expected = {
        propsTypeName: undefined /* typeArgumentParams[0].typeName.name */,
        componentName: undefined /* funcArgumentParams[0].value */,
      };

      expect(
        parser.getNativeComponentType(typeArgumentParams, funcArgumentParams),
      ).toEqual(expected);
    });
  });

  describe('isOptionalProperty', () => {
    test('when property is optional', () => {
      const property = {
        optional: true,
      };
      expect(parser.isOptionalProperty(property)).toEqual(true);
    });

    test('when property is undefined or not optional', () => {
      const property = {
        optional: false,
      };
      expect(parser.isOptionalProperty(property)).toEqual(false);
    });
  });

  describe('getTypeAnnotationFromProperty', () => {
    test('returns the type annotation', () => {
      const typeAnnotation = {
        type: 'TSStringKeyword',
        key: {
          type: 'Identifier',
          name: 'b',
        },
        members: [],
      };

      const property = {
        typeAnnotation: {
          type: 'TSTypeAnnotation',
          typeAnnotation: typeAnnotation,
        },
      };

      expect(parser.getTypeAnnotationFromProperty(property)).toEqual(
        typeAnnotation,
      );
    });
  });

  describe('typeAlias', () => {
    test('returns typeAlias Property', () => {
      expect(parser.typeAlias).toEqual('TSTypeAliasDeclaration');
    });
  });

  describe('enumDeclaration', () => {
    test('returns enumDeclaration Property', () => {
      expect(parser.enumDeclaration).toEqual('TSEnumDeclaration');
    });
  });

  describe('interfaceDeclaration', () => {
    test('returns interfaceDeclaration Property', () => {
      expect(parser.interfaceDeclaration).toEqual('TSInterfaceDeclaration');
    });
  });

  describe('extractTypeFromTypeAnnotation', () => {
    test('should return the name if typeAnnotation is TSTypeReference', () => {
      const typeAnnotation = {
        type: 'TSTypeReference',
        typeName: {
          name: 'SomeType',
        },
      };

      expect(parser.extractTypeFromTypeAnnotation(typeAnnotation)).toEqual(
        'SomeType',
      );
    });

    test('should return the type if typeAnnotation is not TSTypeReference', () => {
      const typeAnnotation = {
        type: 'SomeOtherType',
      };

      expect(parser.extractTypeFromTypeAnnotation(typeAnnotation)).toEqual(
        'SomeOtherType',
      );
    });
  });

  describe('getObjectProperties', () => {
    test('returns members of an object represented by a type annotation', () => {
      const members = [
        {
          type: 'ObjectTypeProperty',
          key: {
            type: 'Identifier',
            name: 'a',
          },
          value: {
            type: 'StringTypeAnnotation',
            range: [],
          },
        },
        {
          type: 'ObjectTypeProperty',
          key: {
            type: 'Identifier',
            name: 'b',
          },
          optional: true,
          value: {
            type: 'BooleanTypeAnnotation',
            range: [],
          },
        },
      ];

      const typeAnnotation = {
        type: 'TypeAlias',
        members: members,
      };

      const expected = members;

      expect(parser.getObjectProperties(typeAnnotation)).toEqual(expected);
    });

    test('returns undefined if typeAnnotation does not have members', () => {
      const declaration = {
        type: 'TypeAlias',
      };

      expect(parser.getObjectProperties(declaration)).toEqual(undefined);
    });
  });
});
