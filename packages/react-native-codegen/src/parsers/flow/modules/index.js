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
  NativeModuleEnumMap,
  NativeModuleBaseTypeAnnotation,
  NativeModuleTypeAnnotation,
  Nullable,
} from '../../../CodegenSchema';

import type {Parser} from '../../parser';
import type {ParserErrorCapturer, TypeDeclarationMap} from '../../utils';

const {resolveTypeAnnotation} = require('../utils');
const {
  unwrapNullable,
  wrapNullable,
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  parseObjectProperty,
} = require('../../parsers-commons');
const {
  emitArrayType,
  emitBoolean,
  emitDouble,
  emitFloat,
  emitFunction,
  emitNumber,
  emitInt32,
  emitGenericObject,
  emitObject,
  emitPromise,
  emitRootTag,
  emitVoid,
  emitString,
  emitStringish,
  emitMixed,
  emitUnion,
  typeAliasResolution,
  typeEnumResolution,
} = require('../../parsers-primitives');

const {
  UnsupportedTypeAnnotationParserError,
  UnsupportedGenericParserError,
} = require('../../errors');

const {
  throwIfPartialNotAnnotatingTypeParameter,
  throwIfPartialWithMoreParameter,
} = require('../../error-utils');

const language = 'Flow';

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
  const {nullable, typeAnnotation, typeResolutionStatus} =
    resolveTypeAnnotation(flowTypeAnnotation, types);

  switch (typeAnnotation.type) {
    case 'GenericTypeAnnotation': {
      switch (typeAnnotation.id.name) {
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
        case 'Stringish': {
          return emitStringish(nullable);
        }
        case 'Int32': {
          return emitInt32(nullable);
        }
        case 'Double': {
          return emitDouble(nullable);
        }
        case 'Float': {
          return emitFloat(nullable);
        }
        case 'UnsafeObject':
        case 'Object': {
          return emitGenericObject(nullable);
        }
        case '$Partial': {
          throwIfPartialWithMoreParameter(typeAnnotation);

          const annotatedElement = parser.extractAnnotatedElement(
            typeAnnotation,
            types,
          );

          throwIfPartialNotAnnotatingTypeParameter(
            typeAnnotation,
            types,
            parser,
          );

          const properties = parser.computePartialProperties(
            annotatedElement.right.properties,
            hasteModuleName,
            types,
            aliasMap,
            enumMap,
            tryParse,
            cxxOnly,
          );

          return emitObject(nullable, properties);
        }
        default: {
          throw new UnsupportedGenericParserError(
            hasteModuleName,
            typeAnnotation,
            parser,
          );
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
          translateTypeAnnotation(
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
          return emitGenericObject(nullable);
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
    case 'BooleanTypeAnnotation': {
      return emitBoolean(nullable);
    }
    case 'NumberTypeAnnotation': {
      return emitNumber(nullable);
    }
    case 'VoidTypeAnnotation': {
      return emitVoid(nullable);
    }
    case 'StringTypeAnnotation': {
      return emitString(nullable);
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
    case 'MixedTypeAnnotation': {
      if (cxxOnly) {
        return emitMixed(nullable);
      } else {
        return emitGenericObject(nullable);
      }
    }
    case 'EnumStringBody':
    case 'EnumNumberBody': {
      return typeEnumResolution(
        typeAnnotation,
        typeResolutionStatus,
        nullable,
        hasteModuleName,
        language,
        enumMap,
        parser,
      );
    }
    default: {
      throw new UnsupportedTypeAnnotationParserError(
        hasteModuleName,
        typeAnnotation,
        language,
      );
    }
  }
}

module.exports = {
  flowTranslateTypeAnnotation: translateTypeAnnotation,
};
