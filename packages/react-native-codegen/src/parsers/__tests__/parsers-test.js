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
      it('returns property name', () => {
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
      it('throw UnsupportedObjectPropertyTypeAnnotationParserError', () => {
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
    it('returns remaped union annotation member types without duplicates', () => {
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
    it('returns true if it is a valid node', () => {
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

    it('returns false if it is a invalid node', () => {
      const node = {};
      expect(parser.isModuleInterface(node)).toBe(false);
    });
  });

  describe('isGenericTypeAnnotation', () => {
    it('returns true if it is a generic type annotation', () => {
      expect(parser.isGenericTypeAnnotation('GenericTypeAnnotation')).toBe(
        true,
      );
    });

    it('returns false if it is not a generic type annotation', () => {
      expect(parser.isGenericTypeAnnotation('StringTypeAnnotation')).toBe(
        false,
      );
    });
  });

  describe('callExpressionTypeParameters', () => {
    it('returns type arguments if it is a valid node', () => {
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

    it('returns null if it is a invalid node', () => {
      const node = {};
      expect(parser.callExpressionTypeParameters(node)).toBe(null);
    });
  });

  describe('computePartialProperties', () => {
    it('returns partial properties', () => {
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
    it('returns type arguments params from declaration', () => {
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

    it('returns undefined if declaration type argument params is Invalid', () => {
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
    it('returns native component type when typeArgumentParams & funcArgumentParams are valid', () => {
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

    it('returns undefined when typeArgumentParams & funcArgumentParams are invalid', () => {
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
});

describe('TypeScriptParser', () => {
  const parser = new TypeScriptParser();
  describe('getKeyName', () => {
    describe('when propertyOrIndex is TSPropertySignature', () => {
      it('returns property name', () => {
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
      it('throw UnsupportedObjectPropertyTypeAnnotationParserError', () => {
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
    it('returns remaped union annotation member types without duplicates', () => {
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
    it('returns true if it is a valid node', () => {
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

    it('returns false if it is a invalid node', () => {
      const node = {};
      expect(parser.isModuleInterface(node)).toBe(false);
    });
  });

  describe('isGenericTypeAnnotation', () => {
    it('returns true if it is a generic type annotation', () => {
      expect(parser.isGenericTypeAnnotation('TSTypeReference')).toBe(true);
    });

    it('returns false if it is not a generic type annotation', () => {
      expect(parser.isGenericTypeAnnotation('StringTypeAnnotation')).toBe(
        false,
      );
    });
  });

  describe('callExpressionTypeParameters', () => {
    it('returns type parameters if it is a valid node', () => {
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

    it('returns null if it is a invalid node', () => {
      const node = {};
      expect(parser.callExpressionTypeParameters(node)).toBe(null);
    });
  });

  describe('computePartialProperties', () => {
    it('returns partial properties', () => {
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
    it('returns type argument params from declaration', () => {
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

    it('returns undefined if declaration type arguments params is Invalid', () => {
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
    it('returns native component type when typeArgumentParams & funcArgumentParams are valid', () => {
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

    it('returns undefined when typeArgumentParams & funcArgumentParams are invalid', () => {
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
});
