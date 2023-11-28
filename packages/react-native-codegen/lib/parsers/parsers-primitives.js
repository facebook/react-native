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

function _slicedToArray(arr, i) {
  return (
    _arrayWithHoles(arr) ||
    _iterableToArrayLimit(arr, i) ||
    _unsupportedIterableToArray(arr, i) ||
    _nonIterableRest()
  );
}
function _nonIterableRest() {
  throw new TypeError(
    'Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
  );
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === 'string') return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === 'Object' && o.constructor) n = o.constructor.name;
  if (n === 'Map' || n === 'Set') return Array.from(o);
  if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _iterableToArrayLimit(r, l) {
  var t =
    null == r
      ? null
      : ('undefined' != typeof Symbol && r[Symbol.iterator]) || r['@@iterator'];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = !0,
      o = !1;
    try {
      if (((i = (t = t.call(r)).next), 0 === l)) {
        if (Object(t) !== t) return;
        f = !1;
      } else
        for (
          ;
          !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l);
          f = !0
        );
    } catch (r) {
      (o = !0), (n = r);
    } finally {
      try {
        if (!f && null != t.return && ((u = t.return()), Object(u) !== u))
          return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}
const _require = require('./errors'),
  UnsupportedUnionTypeAnnotationParserError =
    _require.UnsupportedUnionTypeAnnotationParserError,
  UnsupportedTypeAnnotationParserError =
    _require.UnsupportedTypeAnnotationParserError,
  ParserError = _require.ParserError;
const _require2 = require('./error-utils'),
  throwIfArrayElementTypeAnnotationIsUnsupported =
    _require2.throwIfArrayElementTypeAnnotationIsUnsupported,
  throwIfPartialNotAnnotatingTypeParameter =
    _require2.throwIfPartialNotAnnotatingTypeParameter,
  throwIfPartialWithMoreParameter = _require2.throwIfPartialWithMoreParameter;
const _require3 = require('./parsers-utils'),
  nullGuard = _require3.nullGuard;
const _require4 = require('./parsers-commons'),
  assertGenericTypeAnnotationHasExactlyOneTypeParameter =
    _require4.assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  wrapNullable = _require4.wrapNullable,
  unwrapNullable = _require4.unwrapNullable,
  translateFunctionTypeAnnotation = _require4.translateFunctionTypeAnnotation;
const _require5 = require('./utils'),
  isModuleRegistryCall = _require5.isModuleRegistryCall;
function emitBoolean(nullable) {
  return wrapNullable(nullable, {
    type: 'BooleanTypeAnnotation',
  });
}
function emitInt32(nullable) {
  return wrapNullable(nullable, {
    type: 'Int32TypeAnnotation',
  });
}
function emitInt32Prop(name, optional) {
  return {
    name,
    optional,
    typeAnnotation: {
      type: 'Int32TypeAnnotation',
    },
  };
}
function emitNumber(nullable) {
  return wrapNullable(nullable, {
    type: 'NumberTypeAnnotation',
  });
}
function emitRootTag(nullable) {
  return wrapNullable(nullable, {
    type: 'ReservedTypeAnnotation',
    name: 'RootTag',
  });
}
function emitDouble(nullable) {
  return wrapNullable(nullable, {
    type: 'DoubleTypeAnnotation',
  });
}
function emitDoubleProp(name, optional) {
  return {
    name,
    optional,
    typeAnnotation: {
      type: 'DoubleTypeAnnotation',
    },
  };
}
function emitVoid(nullable) {
  return wrapNullable(nullable, {
    type: 'VoidTypeAnnotation',
  });
}
function emitStringish(nullable) {
  return wrapNullable(nullable, {
    type: 'StringTypeAnnotation',
  });
}
function emitFunction(
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
) {
  const translateFunctionTypeAnnotationValue = translateFunctionTypeAnnotation(
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
  return wrapNullable(nullable, translateFunctionTypeAnnotationValue);
}
function emitMixed(nullable) {
  return wrapNullable(nullable, {
    type: 'MixedTypeAnnotation',
  });
}
function emitString(nullable) {
  return wrapNullable(nullable, {
    type: 'StringTypeAnnotation',
  });
}
function emitStringProp(name, optional) {
  return {
    name,
    optional,
    typeAnnotation: {
      type: 'StringTypeAnnotation',
    },
  };
}
function typeAliasResolution(
  typeResolution,
  objectTypeAnnotation,
  aliasMap,
  nullable,
) {
  if (!typeResolution.successful) {
    return wrapNullable(nullable, objectTypeAnnotation);
  }

  /**
   * All aliases RHS are required.
   */
  aliasMap[typeResolution.name] = objectTypeAnnotation;

  /**
   * Nullability of type aliases is transitive.
   *
   * Consider this case:
   *
   * type Animal = ?{
   *   name: string,
   * };
   *
   * type B = Animal
   *
   * export interface Spec extends TurboModule {
   *   +greet: (animal: B) => void;
   * }
   *
   * In this case, we follow B to Animal, and then Animal to ?{name: string}.
   *
   * We:
   *   1. Replace `+greet: (animal: B) => void;` with `+greet: (animal: ?Animal) => void;`,
   *   2. Pretend that Animal = {name: string}.
   *
   * Why do we do this?
   *  1. In ObjC, we need to generate a struct called Animal, not B.
   *  2. This design is simpler than managing nullability within both the type alias usage, and the type alias RHS.
   *  3. What does it mean for a C++ struct, which is what this type alias RHS will generate, to be nullable? ¯\_(ツ)_/¯
   *     Nullability is a concept that only makes sense when talking about instances (i.e: usages) of the C++ structs.
   *     Hence, it's better to manage nullability within the actual TypeAliasTypeAnnotation nodes, and not the
   *     associated ObjectTypeAnnotations.
   */
  return wrapNullable(nullable, {
    type: 'TypeAliasTypeAnnotation',
    name: typeResolution.name,
  });
}
function typeEnumResolution(
  typeAnnotation,
  typeResolution,
  nullable,
  hasteModuleName,
  enumMap,
  parser,
) {
  if (!typeResolution.successful || typeResolution.type !== 'enum') {
    throw new UnsupportedTypeAnnotationParserError(
      hasteModuleName,
      typeAnnotation,
      parser.language(),
    );
  }
  const enumName = typeResolution.name;
  const enumMemberType = parser.parseEnumMembersType(typeAnnotation);
  try {
    parser.validateEnumMembersSupported(typeAnnotation, enumMemberType);
  } catch (e) {
    if (e instanceof Error) {
      throw new ParserError(
        hasteModuleName,
        typeAnnotation,
        `Failed parsing the enum ${enumName} in ${hasteModuleName} with the error: ${e.message}`,
      );
    } else {
      throw e;
    }
  }
  const enumMembers = parser.parseEnumMembers(typeAnnotation);
  enumMap[enumName] = {
    name: enumName,
    type: 'EnumDeclarationWithMembers',
    memberType: enumMemberType,
    members: enumMembers,
  };
  return wrapNullable(nullable, {
    name: enumName,
    type: 'EnumDeclaration',
    memberType: enumMemberType,
  });
}
function emitPromise(
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
) {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter(
    hasteModuleName,
    typeAnnotation,
    parser,
  );
  const elementType = typeAnnotation.typeParameters.params[0];
  if (
    elementType.type === 'ExistsTypeAnnotation' ||
    elementType.type === 'EmptyTypeAnnotation'
  ) {
    return wrapNullable(nullable, {
      type: 'PromiseTypeAnnotation',
    });
  } else {
    try {
      return wrapNullable(nullable, {
        type: 'PromiseTypeAnnotation',
        elementType: translateTypeAnnotation(
          hasteModuleName,
          typeAnnotation.typeParameters.params[0],
          types,
          aliasMap,
          enumMap,
          tryParse,
          cxxOnly,
          parser,
        ),
      });
    } catch {
      return wrapNullable(nullable, {
        type: 'PromiseTypeAnnotation',
      });
    }
  }
}
function emitGenericObject(nullable) {
  return wrapNullable(nullable, {
    type: 'GenericObjectTypeAnnotation',
  });
}
function emitDictionary(nullable, valueType) {
  return wrapNullable(nullable, {
    type: 'GenericObjectTypeAnnotation',
    dictionaryValueType: valueType,
  });
}
function emitObject(nullable, properties) {
  return wrapNullable(nullable, {
    type: 'ObjectTypeAnnotation',
    properties,
  });
}
function emitFloat(nullable) {
  return wrapNullable(nullable, {
    type: 'FloatTypeAnnotation',
  });
}
function emitFloatProp(name, optional) {
  return {
    name,
    optional,
    typeAnnotation: {
      type: 'FloatTypeAnnotation',
    },
  };
}
function emitUnion(nullable, hasteModuleName, typeAnnotation, parser) {
  const unionTypes = parser.remapUnionTypeAnnotationMemberNames(
    typeAnnotation.types,
  );

  // Only support unionTypes of the same kind
  if (unionTypes.length > 1) {
    throw new UnsupportedUnionTypeAnnotationParserError(
      hasteModuleName,
      typeAnnotation,
      unionTypes,
    );
  }
  return wrapNullable(nullable, {
    type: 'UnionTypeAnnotation',
    memberType: unionTypes[0],
  });
}
function translateArrayTypeAnnotation(
  hasteModuleName,
  types,
  aliasMap,
  enumMap,
  cxxOnly,
  arrayType,
  elementType,
  nullable,
  translateTypeAnnotation,
  parser,
) {
  try {
    /**
     * TODO(T72031674): Migrate all our NativeModule specs to not use
     * invalid Array ElementTypes. Then, make the elementType a required
     * parameter.
     */
    const _unwrapNullable = unwrapNullable(
        translateTypeAnnotation(
          hasteModuleName,
          elementType,
          types,
          aliasMap,
          enumMap,
          /**
           * TODO(T72031674): Ensure that all ParsingErrors that are thrown
           * while parsing the array element don't get captured and collected.
           * Why? If we detect any parsing error while parsing the element,
           * we should default it to null down the line, here. This is
           * the correct behaviour until we migrate all our NativeModule specs
           * to be parseable.
           */
          nullGuard,
          cxxOnly,
          parser,
        ),
      ),
      _unwrapNullable2 = _slicedToArray(_unwrapNullable, 2),
      _elementType = _unwrapNullable2[0],
      isElementTypeNullable = _unwrapNullable2[1];
    throwIfArrayElementTypeAnnotationIsUnsupported(
      hasteModuleName,
      elementType,
      arrayType,
      _elementType.type,
    );
    return wrapNullable(nullable, {
      type: 'ArrayTypeAnnotation',
      // $FlowFixMe[incompatible-call]
      elementType: wrapNullable(isElementTypeNullable, _elementType),
    });
  } catch (ex) {
    return wrapNullable(nullable, {
      type: 'ArrayTypeAnnotation',
    });
  }
}
function emitArrayType(
  hasteModuleName,
  typeAnnotation,
  parser,
  types,
  aliasMap,
  enumMap,
  cxxOnly,
  nullable,
  translateTypeAnnotation,
) {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter(
    hasteModuleName,
    typeAnnotation,
    parser,
  );
  return translateArrayTypeAnnotation(
    hasteModuleName,
    types,
    aliasMap,
    enumMap,
    cxxOnly,
    typeAnnotation.type,
    typeAnnotation.typeParameters.params[0],
    nullable,
    translateTypeAnnotation,
    parser,
  );
}
function Visitor(infoMap) {
  return {
    CallExpression(node) {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'codegenNativeComponent'
      ) {
        infoMap.isComponent = true;
      }
      if (isModuleRegistryCall(node)) {
        infoMap.isModule = true;
      }
    },
    InterfaceExtends(node) {
      if (node.id.name === 'TurboModule') {
        infoMap.isModule = true;
      }
    },
    TSInterfaceDeclaration(node) {
      if (
        Array.isArray(node.extends) &&
        node.extends.some(
          extension => extension.expression.name === 'TurboModule',
        )
      ) {
        infoMap.isModule = true;
      }
    },
  };
}
function emitPartial(
  nullable,
  hasteModuleName,
  typeAnnotation,
  types,
  aliasMap,
  enumMap,
  tryParse,
  cxxOnly,
  parser,
) {
  throwIfPartialWithMoreParameter(typeAnnotation);
  throwIfPartialNotAnnotatingTypeParameter(typeAnnotation, types, parser);
  const annotatedElement = parser.extractAnnotatedElement(
    typeAnnotation,
    types,
  );
  const annotatedElementProperties =
    parser.getAnnotatedElementProperties(annotatedElement);
  const partialProperties = parser.computePartialProperties(
    annotatedElementProperties,
    hasteModuleName,
    types,
    aliasMap,
    enumMap,
    tryParse,
    cxxOnly,
  );
  return emitObject(nullable, partialProperties);
}
function emitCommonTypes(
  hasteModuleName,
  types,
  typeAnnotation,
  aliasMap,
  enumMap,
  tryParse,
  cxxOnly,
  nullable,
  parser,
) {
  const typeMap = {
    Stringish: emitStringish,
    Int32: emitInt32,
    Double: emitDouble,
    Float: emitFloat,
    UnsafeObject: emitGenericObject,
    Object: emitGenericObject,
    $Partial: emitPartial,
    Partial: emitPartial,
    BooleanTypeAnnotation: emitBoolean,
    NumberTypeAnnotation: emitNumber,
    VoidTypeAnnotation: emitVoid,
    StringTypeAnnotation: emitString,
    MixedTypeAnnotation: cxxOnly ? emitMixed : emitGenericObject,
  };
  const typeAnnotationName = parser.convertKeywordToTypeAnnotation(
    typeAnnotation.type,
  );
  const simpleEmitter = typeMap[typeAnnotationName];
  if (simpleEmitter) {
    return simpleEmitter(nullable);
  }
  const genericTypeAnnotationName =
    parser.getTypeAnnotationName(typeAnnotation);
  const emitter = typeMap[genericTypeAnnotationName];
  if (!emitter) {
    return null;
  }
  return emitter(
    nullable,
    hasteModuleName,
    typeAnnotation,
    types,
    aliasMap,
    enumMap,
    tryParse,
    cxxOnly,
    parser,
  );
}
function emitBoolProp(name, optional) {
  return {
    name,
    optional,
    typeAnnotation: {
      type: 'BooleanTypeAnnotation',
    },
  };
}
function emitMixedProp(name, optional) {
  return {
    name,
    optional,
    typeAnnotation: {
      type: 'MixedTypeAnnotation',
    },
  };
}
function emitObjectProp(
  name,
  optional,
  parser,
  typeAnnotation,
  extractArrayElementType,
) {
  return {
    name,
    optional,
    typeAnnotation: extractArrayElementType(typeAnnotation, name, parser),
  };
}
function emitUnionProp(name, optional, parser, typeAnnotation) {
  return {
    name,
    optional,
    typeAnnotation: {
      type: 'StringEnumTypeAnnotation',
      options: typeAnnotation.types.map(option =>
        parser.getLiteralValue(option),
      ),
    },
  };
}
module.exports = {
  emitArrayType,
  emitBoolean,
  emitBoolProp,
  emitDouble,
  emitDoubleProp,
  emitFloat,
  emitFloatProp,
  emitFunction,
  emitInt32,
  emitInt32Prop,
  emitMixedProp,
  emitNumber,
  emitGenericObject,
  emitDictionary,
  emitObject,
  emitPromise,
  emitRootTag,
  emitVoid,
  emitString,
  emitStringish,
  emitStringProp,
  emitMixed,
  emitUnion,
  emitPartial,
  emitCommonTypes,
  typeAliasResolution,
  typeEnumResolution,
  translateArrayTypeAnnotation,
  Visitor,
  emitObjectProp,
  emitUnionProp,
};
