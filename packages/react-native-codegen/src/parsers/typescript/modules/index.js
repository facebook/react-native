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
  NativeModulePropertyShape,
  NativeModuleTypeAnnotation,
  NativeModuleSchema,
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

const {verifyPlatforms} = require('../../utils');
const {resolveTypeAnnotation} = require('../utils');

const {
  parseObjectProperty,
  buildPropertySchema,
  parseModuleName,
} = require('../../parsers-commons');
const {typeEnumResolution} = require('../../parsers-primitives');

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
  translateArrayTypeAnnotation,
} = require('../../parsers-primitives');

const {
  UnsupportedGenericParserError,
  UnsupportedTypeAnnotationParserError,
} = require('../../errors');

const {
  throwIfModuleInterfaceNotFound,
  throwIfModuleInterfaceIsMisnamed,
  throwIfMoreThanOneModuleInterfaceParserError,
  throwIfPartialNotAnnotatingTypeParameter,
  throwIfPartialWithMoreParameter,
} = require('../../error-utils');

const language = 'TypeScript';

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
      switch (typeAnnotation.typeName.name) {
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
        case 'Partial': {
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
            annotatedElement.typeAnnotation.members,
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
        language,
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
        language,
      );
    }
  }
}

function buildModuleSchema(
  hasteModuleName: string,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  ast: $FlowFixMe,
  tryParse: ParserErrorCapturer,
  parser: Parser,
): NativeModuleSchema {
  const types = parser.getTypes(ast);
  const moduleSpecs = (Object.values(types): $ReadOnlyArray<$FlowFixMe>).filter(
    t => parser.isModuleInterface(t),
  );

  throwIfModuleInterfaceNotFound(
    moduleSpecs.length,
    hasteModuleName,
    ast,
    language,
  );

  throwIfMoreThanOneModuleInterfaceParserError(
    hasteModuleName,
    moduleSpecs,
    language,
  );

  const [moduleSpec] = moduleSpecs;

  throwIfModuleInterfaceIsMisnamed(hasteModuleName, moduleSpec.id, language);

  // Parse Module Name
  // Also checks and throws error if:
  // - Module Interface is Unused
  // - More than 1 Module Registry Calls
  // - Wrong number of Call Expression Args
  // - Module Registry Call Args are Incorrect
  // - Module is Untyped
  // - Module Registry Call Type Parameter is Icorrect
  const moduleName = parseModuleName(hasteModuleName, moduleSpec, ast, parser);

  // Some module names use platform suffix to indicate platform-exclusive modules.
  // Eventually this should be made explicit in the Flow type itself.
  // Also check the hasteModuleName for platform suffix.
  // Note: this shape is consistent with ComponentSchema.
  const {cxxOnly, excludedPlatforms} = verifyPlatforms(
    hasteModuleName,
    moduleName,
  );

  // $FlowFixMe[missing-type-arg]
  return (moduleSpec.body.body: $ReadOnlyArray<$FlowFixMe>)
    .filter(
      property =>
        property.type === 'TSMethodSignature' ||
        property.type === 'TSPropertySignature',
    )
    .map<?{
      aliasMap: NativeModuleAliasMap,
      enumMap: NativeModuleEnumMap,
      propertyShape: NativeModulePropertyShape,
    }>(property => {
      const aliasMap: {...NativeModuleAliasMap} = {};
      const enumMap: {...NativeModuleEnumMap} = {};

      return tryParse(() => ({
        aliasMap: aliasMap,
        enumMap: enumMap,
        propertyShape: buildPropertySchema(
          hasteModuleName,
          property,
          types,
          aliasMap,
          enumMap,
          tryParse,
          cxxOnly,
          resolveTypeAnnotation,
          translateTypeAnnotation,
          parser,
        ),
      }));
    })
    .filter(Boolean)
    .reduce(
      (
        moduleSchema: NativeModuleSchema,
        {aliasMap, enumMap, propertyShape},
      ) => {
        return {
          type: 'NativeModule',
          aliasMap: {...moduleSchema.aliasMap, ...aliasMap},
          enumMap: {...moduleSchema.enumMap, ...enumMap},
          spec: {
            properties: [...moduleSchema.spec.properties, propertyShape],
          },
          moduleName: moduleSchema.moduleName,
          excludedPlatforms: moduleSchema.excludedPlatforms,
        };
      },
      {
        type: 'NativeModule',
        aliasMap: {},
        enumMap: {},
        spec: {properties: []},
        moduleName: moduleName,
        excludedPlatforms:
          excludedPlatforms.length !== 0 ? [...excludedPlatforms] : undefined,
      },
    );
}

module.exports = {
  buildModuleSchema,
  typeScriptTranslateTypeAnnotation: translateTypeAnnotation,
};
