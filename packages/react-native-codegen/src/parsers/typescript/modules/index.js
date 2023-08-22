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
import type {
  ParserErrorCapturer,
  TypeResolutionStatus,
  TypeDeclarationMap,
} from '../../utils';
const {flattenIntersectionType} = require('../parseTopLevelType');
const {flattenProperties} = require('../components/componentsUtils');

const {resolveTypeAnnotation} = require('../utils');

const {parseObjectProperty} = require('../../parsers-commons');

const {
  emitArrayType,
  emitBoolean,
  emitFunction,
  emitNumber,
  emitGenericObject,
  emitPromise,
  emitRootTag,
  emitVoid,
  emitString,
  emitMixed,
  emitUnion,
  emitCommonTypes,
  typeAliasResolution,
  typeEnumResolution,
  translateArrayTypeAnnotation,
} = require('../../parsers-primitives');

const {
  UnsupportedGenericParserError,
  UnsupportedTypeAnnotationParserError,
} = require('../../errors');

function translateObjectTypeAnnotation(
  hasteModuleName: string,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  nullable: boolean,
  objectMembers: $ReadOnlyArray<$FlowFixMe>,
  typeResolutionStatus: TypeResolutionStatus,
  baseTypes: $ReadOnlyArray<string>,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  parser: Parser,
): Nullable<NativeModuleTypeAnnotation> {
  // $FlowFixMe[missing-type-arg]
  const properties = objectMembers
    .map<?NamedShape<Nullable<NativeModuleBaseTypeAnnotation>>>(property => {
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
    })
    .filter(Boolean);

  let objectTypeAnnotation;
  if (baseTypes.length === 0) {
    objectTypeAnnotation = {
      type: 'ObjectTypeAnnotation',
      properties,
    };
  } else {
    objectTypeAnnotation = {
      type: 'ObjectTypeAnnotation',
      properties,
      baseTypes,
    };
  }

  return typeAliasResolution(
    typeResolutionStatus,
    objectTypeAnnotation,
    aliasMap,
    nullable,
  );
}

function translateTypeReferenceAnnotation(
  typeName: string,
  nullable: boolean,
  typeAnnotation: $FlowFixMe,
  hasteModuleName: string,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  parser: Parser,
): Nullable<NativeModuleTypeAnnotation> {
  switch (typeName) {
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
    case 'ReadonlyArray': {
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
function translateTypeAnnotation(
  hasteModuleName: string,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  typeScriptTypeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  parser: Parser,
): Nullable<NativeModuleTypeAnnotation> {
  const {nullable, typeAnnotation, typeResolutionStatus} =
    resolveTypeAnnotation(typeScriptTypeAnnotation, types);

  switch (typeAnnotation.type) {
    case 'TSArrayType': {
      return translateArrayTypeAnnotation(
        hasteModuleName,
        types,
        aliasMap,
        enumMap,
        cxxOnly,
        'Array',
        typeAnnotation.elementType,
        nullable,
        translateTypeAnnotation,
        parser,
      );
    }
    case 'TSTypeOperator': {
      if (
        typeAnnotation.operator === 'readonly' &&
        typeAnnotation.typeAnnotation.type === 'TSArrayType'
      ) {
        return translateArrayTypeAnnotation(
          hasteModuleName,
          types,
          aliasMap,
          enumMap,
          cxxOnly,
          'ReadonlyArray',
          typeAnnotation.typeAnnotation.elementType,
          nullable,
          translateTypeAnnotation,
          parser,
        );
      } else {
        throw new UnsupportedGenericParserError(
          hasteModuleName,
          typeAnnotation,
          parser,
        );
      }
    }
    case 'TSTypeReference': {
      return translateTypeReferenceAnnotation(
        typeAnnotation.typeName.name,
        nullable,
        typeAnnotation,
        hasteModuleName,
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        parser,
      );
    }
    case 'TSInterfaceDeclaration': {
      const baseTypes = (typeAnnotation.extends ?? []).map(
        extend => extend.expression.name,
      );
      for (const baseType of baseTypes) {
        // ensure base types exist and appear in aliasMap
        translateTypeAnnotation(
          hasteModuleName,
          {
            type: 'TSTypeReference',
            typeName: {type: 'Identifier', name: baseType},
          },
          types,
          aliasMap,
          enumMap,
          tryParse,
          cxxOnly,
          parser,
        );
      }

      return translateObjectTypeAnnotation(
        hasteModuleName,
        nullable,
        flattenProperties([typeAnnotation], types),
        typeResolutionStatus,
        baseTypes,
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        parser,
      );
    }
    case 'TSIntersectionType': {
      return translateObjectTypeAnnotation(
        hasteModuleName,
        nullable,
        flattenProperties(
          flattenIntersectionType(typeAnnotation, types),
          types,
        ),
        typeResolutionStatus,
        [],
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        parser,
      );
    }
    case 'TSTypeLiteral': {
      // if there is TSIndexSignature, then it is a dictionary
      if (typeAnnotation.members) {
        const indexSignatures = typeAnnotation.members.filter(
          member => member.type === 'TSIndexSignature',
        );
        if (indexSignatures.length > 0) {
          // check the property type to prevent developers from using unsupported types
          // the return value from `translateTypeAnnotation` is unused
          const propertyType = indexSignatures[0].typeAnnotation;
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

      return translateObjectTypeAnnotation(
        hasteModuleName,
        nullable,
        typeAnnotation.members,
        typeResolutionStatus,
        [],
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        parser,
      );
    }
    case 'TSEnumDeclaration': {
      return typeEnumResolution(
        typeAnnotation,
        typeResolutionStatus,
        nullable,
        hasteModuleName,
        enumMap,
        parser,
      );
    }
    case 'TSBooleanKeyword': {
      return emitBoolean(nullable);
    }
    case 'TSNumberKeyword': {
      return emitNumber(nullable);
    }
    case 'TSVoidKeyword': {
      return emitVoid(nullable);
    }
    case 'TSStringKeyword': {
      return emitString(nullable);
    }
    case 'TSFunctionType': {
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
    case 'TSUnionType': {
      return emitUnion(nullable, hasteModuleName, typeAnnotation, parser);
    }
    case 'TSUnknownKeyword': {
      if (cxxOnly) {
        return emitMixed(nullable);
      }
      // Fallthrough
    }
    default: {
      throw new UnsupportedTypeAnnotationParserError(
        hasteModuleName,
        typeAnnotation,
        parser.language(),
      );
    }
  }
}

module.exports = {
  typeScriptTranslateTypeAnnotation: translateTypeAnnotation,
};
