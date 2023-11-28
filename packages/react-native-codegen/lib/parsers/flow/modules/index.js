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
const _require = require('../../parsers-commons'),
  unwrapNullable = _require.unwrapNullable,
  wrapNullable = _require.wrapNullable,
  assertGenericTypeAnnotationHasExactlyOneTypeParameter =
    _require.assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  parseObjectProperty = _require.parseObjectProperty;
const _require2 = require('../../parsers-primitives'),
  emitArrayType = _require2.emitArrayType,
  emitFunction = _require2.emitFunction,
  emitDictionary = _require2.emitDictionary,
  emitPromise = _require2.emitPromise,
  emitRootTag = _require2.emitRootTag,
  emitUnion = _require2.emitUnion,
  emitCommonTypes = _require2.emitCommonTypes,
  typeAliasResolution = _require2.typeAliasResolution,
  typeEnumResolution = _require2.typeEnumResolution;
const _require3 = require('../../errors'),
  UnsupportedTypeAnnotationParserError =
    _require3.UnsupportedTypeAnnotationParserError,
  UnsupportedGenericParserError = _require3.UnsupportedGenericParserError;
function translateTypeAnnotation(
  hasteModuleName,
  /**
   * TODO(T71778680): Flow-type this node.
   */
  flowTypeAnnotation,
  types,
  aliasMap,
  enumMap,
  tryParse,
  cxxOnly,
  parser,
) {
  const resolveTypeAnnotationFN = parser.getResolveTypeAnnotationFN();
  const _resolveTypeAnnotatio = resolveTypeAnnotationFN(
      flowTypeAnnotation,
      types,
      parser,
    ),
    nullable = _resolveTypeAnnotatio.nullable,
    typeAnnotation = _resolveTypeAnnotatio.typeAnnotation,
    typeResolutionStatus = _resolveTypeAnnotatio.typeResolutionStatus;
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
          const _unwrapNullable = unwrapNullable(
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
            ),
            _unwrapNullable2 = _slicedToArray(_unwrapNullable, 2),
            paramType = _unwrapNullable2[0],
            isParamNullable = _unwrapNullable2[1];
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
        properties: [...typeAnnotation.properties, ...typeAnnotation.indexers]
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
