/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {
  NamedShape,
  NativeModuleAliasMap,
  NativeModuleBaseTypeAnnotation,
  NativeModuleEnumMap,
  NativeModuleTypeAnnotation,
  Nullable,
} from '../../../CodegenSchema';
import type {Parser} from '../../parser';
import type {ParserErrorCapturer, TypeDeclarationMap} from '../../utils';

const {
  UnsupportedGenericParserError,
  UnsupportedTypeAnnotationParserError,
} = require('../../errors');
const {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  parseObjectProperty,
  unwrapNullable,
  wrapNullable,
} = require('../../parsers-commons');
const {
  emitArrayType,
  emitCommonTypes,
  emitDictionary,
  emitFunction,
  emitPromise,
  emitRootTag,
  emitUnion,
  typeAliasResolution,
  typeEnumResolution,
} = require('../../parsers-primitives');

function translateTypeAnnotation(
  hasteModuleName: string,
  /**
   * TODO(T71778680): Flow-type this node.
   */
  flowTypeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  parser: Parser,
): Nullable<NativeModuleTypeAnnotation> {
  const resolveTypeAnnotationFN = parser.getResolveTypeAnnotationFN();
  const {nullable, typeAnnotation, typeResolutionStatus} =
    resolveTypeAnnotationFN(flowTypeAnnotation, types, parser);

  switch (typeAnnotation.type) {
    case 'GenericTypeAnnotation': {
      switch (parser.getTypeAnnotationName(typeAnnotation)) {
        case 'RootTag': {
          return emitRootTag(nullable);
        }
        case 'Promise': {
          return emitPromise(
            hasteModuleName,
            typeAnnotation,
            parser,
            nullable,
            types,
            aliasMap,
            enumMap,
            tryParse,
            cxxOnly,
            translateTypeAnnotation,
          );
        }
        case 'Array':
        case '$ReadOnlyArray': {
          return emitArrayType(
            hasteModuleName,
            typeAnnotation,
            parser,
            types,
            aliasMap,
            enumMap,
            cxxOnly,
            nullable,
            translateTypeAnnotation,
          );
        }
        case '$ReadOnly': {
          assertGenericTypeAnnotationHasExactlyOneTypeParameter(
            hasteModuleName,
            typeAnnotation,
            parser,
          );

          const [paramType, isParamNullable] = unwrapNullable(
            translateTypeAnnotation(
              hasteModuleName,
              typeAnnotation.typeParameters.params[0],
              types,
              aliasMap,
              enumMap,
              tryParse,
              cxxOnly,
              parser,
            ),
          );

          return wrapNullable(nullable || isParamNullable, paramType);
        }
        default: {
          const commonType = emitCommonTypes(
            hasteModuleName,
            types,
            typeAnnotation,
            aliasMap,
            enumMap,
            tryParse,
            cxxOnly,
            nullable,
            parser,
          );

          if (!commonType) {
            throw new UnsupportedGenericParserError(
              hasteModuleName,
              typeAnnotation,
              parser,
            );
          }
          return commonType;
        }
      }
    }
    case 'ObjectTypeAnnotation': {
      // if there is any indexer, then it is a dictionary
      if (typeAnnotation.indexers) {
        const indexers = typeAnnotation.indexers.filter(
          member => member.type === 'ObjectTypeIndexer',
        );
        if (indexers.length > 0) {
          // check the property type to prevent developers from using unsupported types
          // the return value from `translateTypeAnnotation` is unused
          const propertyType = indexers[0].value;
          const valueType = translateTypeAnnotation(
            hasteModuleName,
            propertyType,
            types,
            aliasMap,
            enumMap,
            tryParse,
            cxxOnly,
            parser,
          );
          // no need to do further checking
          return emitDictionary(nullable, valueType);
        }
      }

      const objectTypeAnnotation = {
        type: 'ObjectTypeAnnotation',
        // $FlowFixMe[missing-type-arg]
        properties: ([
          ...typeAnnotation.properties,
          ...typeAnnotation.indexers,
        ]: Array<$FlowFixMe>)
          .map<?NamedShape<Nullable<NativeModuleBaseTypeAnnotation>>>(
            property => {
              return tryParse(() => {
                return parseObjectProperty(
                  flowTypeAnnotation,
                  property,
                  hasteModuleName,
                  types,
                  aliasMap,
                  enumMap,
                  tryParse,
                  cxxOnly,
                  nullable,
                  translateTypeAnnotation,
                  parser,
                );
              });
            },
          )
          .filter(Boolean),
      };

      return typeAliasResolution(
        typeResolutionStatus,
        objectTypeAnnotation,
        aliasMap,
        nullable,
      );
    }
    case 'FunctionTypeAnnotation': {
      return emitFunction(
        nullable,
        hasteModuleName,
        typeAnnotation,
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        translateTypeAnnotation,
        parser,
      );
    }
    case 'UnionTypeAnnotation': {
      return emitUnion(nullable, hasteModuleName, typeAnnotation, parser);
    }
    case 'StringLiteralTypeAnnotation': {
      // 'a' is a special case for 'a' | 'b' but the type name is different
      return wrapNullable(nullable, {
        type: 'UnionTypeAnnotation',
        memberType: 'StringTypeAnnotation',
      });
    }
    case 'EnumStringBody':
    case 'EnumNumberBody': {
      return typeEnumResolution(
        typeAnnotation,
        typeResolutionStatus,
        nullable,
        hasteModuleName,
        enumMap,
        parser,
      );
    }
    default: {
      const commonType = emitCommonTypes(
        hasteModuleName,
        types,
        typeAnnotation,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        nullable,
        parser,
      );

      if (!commonType) {
        throw new UnsupportedTypeAnnotationParserError(
          hasteModuleName,
          typeAnnotation,
          parser.language(),
        );
      }
      return commonType;
    }
  }
}

module.exports = {
  flowTranslateTypeAnnotation: translateTypeAnnotation,
};
