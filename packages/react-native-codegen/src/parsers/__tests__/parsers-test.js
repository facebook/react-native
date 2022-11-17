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

    describe('when propertyOrIndex is ObjectTypeIndexer', () => {
      it('returns indexer name', () => {
        const indexer = {
          type: 'ObjectTypeIndexer',
          id: {
            name: 'indexerName',
          },
        };

        const expected = 'indexerName';

        expect(parser.getKeyName(indexer, hasteModuleName)).toEqual(expected);
      });

      it('returns `key` if indexer has no name', () => {
        const indexer = {
          type: 'ObjectTypeIndexer',
          id: {},
        };

        const expected = 'key';

        expect(parser.getKeyName(indexer, hasteModuleName)).toEqual(expected);
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

    describe('when propertyOrIndex is TSIndexSignature', () => {
      it('returns indexer name', () => {
        const indexer = {
          type: 'TSIndexSignature',
          parameters: [
            {
              name: 'indexerName',
            },
          ],
        };

        const expected = 'indexerName';

        expect(parser.getKeyName(indexer, hasteModuleName)).toEqual(expected);
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
});
