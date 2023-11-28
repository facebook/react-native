/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

'use strict';

const _require = require('../parseTopLevelType'),
  flattenIntersectionType = _require.flattenIntersectionType;
const _require2 = require('../components/componentsUtils'),
  flattenProperties = _require2.flattenProperties;
const _require3 = require('../../parsers-commons'),
  parseObjectProperty = _require3.parseObjectProperty;
const _require4 = require('../../parsers-primitives'),
  emitArrayType = _require4.emitArrayType,
  emitFunction = _require4.emitFunction,
  emitDictionary = _require4.emitDictionary,
  emitPromise = _require4.emitPromise,
  emitRootTag = _require4.emitRootTag,
  emitUnion = _require4.emitUnion,
  emitCommonTypes = _require4.emitCommonTypes,
  typeAliasResolution = _require4.typeAliasResolution,
  typeEnumResolution = _require4.typeEnumResolution,
  translateArrayTypeAnnotation = _require4.translateArrayTypeAnnotation;
const _require5 = require('../../errors'),
  UnsupportedGenericParserError = _require5.UnsupportedGenericParserError,
  UnsupportedTypeAnnotationParserError =
    _require5.UnsupportedTypeAnnotationParserError;
function translateObjectTypeAnnotation(
  hasteModuleName,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  nullable,
  objectMembers,
  typeResolutionStatus,
  baseTypes,
  types,
  aliasMap,
  enumMap,
  tryParse,
  cxxOnly,
  parser,
) {
  // $FlowFixMe[missing-type-arg]
  const properties = objectMembers
    .map(property => {
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
  typeName,
  nullable,
  typeAnnotation,
  hasteModuleName,
  types,
  aliasMap,
  enumMap,
  tryParse,
  cxxOnly,
  parser,
) {
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
  hasteModuleName,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  typeScriptTypeAnnotation,
  types,
  aliasMap,
  enumMap,
  tryParse,
  cxxOnly,
  parser,
) {
  const _parser$getResolvedTy = parser.getResolvedTypeAnnotation(
      typeScriptTypeAnnotation,
      types,
      parser,
    ),
    nullable = _parser$getResolvedTy.nullable,
    typeAnnotation = _parser$getResolvedTy.typeAnnotation,
    typeResolutionStatus = _parser$getResolvedTy.typeResolutionStatus;
  const resolveTypeaAnnotationFn = parser.getResolveTypeAnnotationFN();
  resolveTypeaAnnotationFn(typeScriptTypeAnnotation, types, parser);
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
        parser.getTypeAnnotationName(typeAnnotation),
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
      var _typeAnnotation$exten;
      const baseTypes = (
        (_typeAnnotation$exten = typeAnnotation.extends) !== null &&
        _typeAnnotation$exten !== void 0
          ? _typeAnnotation$exten
          : []
      ).map(extend => extend.expression.name);
      for (const baseType of baseTypes) {
        // ensure base types exist and appear in aliasMap
        translateTypeAnnotation(
          hasteModuleName,
          {
            type: 'TSTypeReference',
            typeName: {
              type: 'Identifier',
              name: baseType,
            },
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
        flattenProperties([typeAnnotation], types, parser),
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
          parser,
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
  typeScriptTranslateTypeAnnotation: translateTypeAnnotation,
};
