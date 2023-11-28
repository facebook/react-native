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
const _require = require('../Utils'),
  getSafePropertyName = _require.getSafePropertyName,
  getNamespacedStructName = _require.getNamespacedStructName;
const _require2 = require('../../../Utils'),
  capitalize = _require2.capitalize;
const _require3 = require('../../../../parsers/parsers-commons'),
  unwrapNullable = _require3.unwrapNullable;
const StructTemplate = ({
  hasteModuleName,
  structName,
  builderInputProps,
}) => `namespace JS {
  namespace ${hasteModuleName} {
    struct ${structName} {

      struct Builder {
        struct Input {
          ${builderInputProps}
        };

        /** Initialize with a set of values */
        Builder(const Input i);
        /** Initialize with an existing ${structName} */
        Builder(${structName} i);
        /** Builds the object. Generally used only by the infrastructure. */
        NSDictionary *buildUnsafeRawValue() const { return _factory(); };
      private:
        NSDictionary *(^_factory)(void);
      };

      static ${structName} fromUnsafeRawValue(NSDictionary *const v) { return {v}; }
      NSDictionary *unsafeRawValue() const { return _v; }
    private:
      ${structName}(NSDictionary *const v) : _v(v) {}
      NSDictionary *_v;
    };
  }
}`;
const MethodTemplate = ({
  hasteModuleName,
  structName,
  properties,
}) => `inline JS::${hasteModuleName}::${structName}::Builder::Builder(const Input i) : _factory(^{
  NSMutableDictionary *d = [NSMutableDictionary new];
${properties}
  return d;
}) {}
inline JS::${hasteModuleName}::${structName}::Builder::Builder(${structName} i) : _factory(^{
  return i.unsafeRawValue();
}) {}`;
function toObjCType(
  hasteModuleName,
  nullableTypeAnnotation,
  isOptional = false,
) {
  const _unwrapNullable = unwrapNullable(nullableTypeAnnotation),
    _unwrapNullable2 = _slicedToArray(_unwrapNullable, 2),
    typeAnnotation = _unwrapNullable2[0],
    nullable = _unwrapNullable2[1];
  const isRequired = !nullable && !isOptional;
  const wrapOptional = type => {
    return isRequired ? type : `std::optional<${type}>`;
  };
  switch (typeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'RootTag':
          return wrapOptional('double');
        default:
          typeAnnotation.name;
          throw new Error(`Unknown prop type, found: ${typeAnnotation.name}"`);
      }
    case 'StringTypeAnnotation':
      return 'NSString *';
    case 'NumberTypeAnnotation':
      return wrapOptional('double');
    case 'FloatTypeAnnotation':
      return wrapOptional('double');
    case 'Int32TypeAnnotation':
      return wrapOptional('double');
    case 'DoubleTypeAnnotation':
      return wrapOptional('double');
    case 'BooleanTypeAnnotation':
      return wrapOptional('bool');
    case 'EnumDeclaration':
      switch (typeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return wrapOptional('double');
        case 'StringTypeAnnotation':
          return 'NSString *';
        default:
          throw new Error(
            `Couldn't convert enum into ObjC type: ${typeAnnotation.type}"`,
          );
      }
    case 'GenericObjectTypeAnnotation':
      return isRequired ? 'id<NSObject> ' : 'id<NSObject> _Nullable ';
    case 'ArrayTypeAnnotation':
      if (typeAnnotation.elementType == null) {
        return isRequired ? 'id<NSObject> ' : 'id<NSObject> _Nullable ';
      }
      return wrapOptional(
        `std::vector<${toObjCType(
          hasteModuleName,
          typeAnnotation.elementType,
        )}>`,
      );
    case 'TypeAliasTypeAnnotation':
      const structName = capitalize(typeAnnotation.name);
      const namespacedStructName = getNamespacedStructName(
        hasteModuleName,
        structName,
      );
      return wrapOptional(`${namespacedStructName}::Builder`);
    default:
      typeAnnotation.type;
      throw new Error(
        `Couldn't convert into ObjC type: ${typeAnnotation.type}"`,
      );
  }
}
function toObjCValue(
  hasteModuleName,
  nullableTypeAnnotation,
  value,
  depth,
  isOptional = false,
) {
  const _unwrapNullable3 = unwrapNullable(nullableTypeAnnotation),
    _unwrapNullable4 = _slicedToArray(_unwrapNullable3, 2),
    typeAnnotation = _unwrapNullable4[0],
    nullable = _unwrapNullable4[1];
  const isRequired = !nullable && !isOptional;
  function wrapPrimitive(type) {
    return !isRequired
      ? `${value}.has_value() ? @((${type})${value}.value()) : nil`
      : `@(${value})`;
  }
  switch (typeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'RootTag':
          return wrapPrimitive('double');
        default:
          typeAnnotation.name;
          throw new Error(
            `Couldn't convert into ObjC type: ${typeAnnotation.type}"`,
          );
      }
    case 'StringTypeAnnotation':
      return value;
    case 'NumberTypeAnnotation':
      return wrapPrimitive('double');
    case 'FloatTypeAnnotation':
      return wrapPrimitive('double');
    case 'Int32TypeAnnotation':
      return wrapPrimitive('double');
    case 'DoubleTypeAnnotation':
      return wrapPrimitive('double');
    case 'BooleanTypeAnnotation':
      return wrapPrimitive('BOOL');
    case 'EnumDeclaration':
      switch (typeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return wrapPrimitive('double');
        case 'StringTypeAnnotation':
          return value;
        default:
          throw new Error(
            `Couldn't convert enum into ObjC value: ${typeAnnotation.type}"`,
          );
      }
    case 'GenericObjectTypeAnnotation':
      return value;
    case 'ArrayTypeAnnotation':
      const elementType = typeAnnotation.elementType;
      if (elementType == null) {
        return value;
      }
      const localVarName = `el${'_'.repeat(depth + 1)}`;
      const elementObjCType = toObjCType(hasteModuleName, elementType);
      const elementObjCValue = toObjCValue(
        hasteModuleName,
        elementType,
        localVarName,
        depth + 1,
      );
      const RCTConvertVecToArray = transformer => {
        return `RCTConvert${
          !isRequired ? 'Optional' : ''
        }VecToArray(${value}, ${transformer})`;
      };
      return RCTConvertVecToArray(
        `^id(${elementObjCType} ${localVarName}) { return ${elementObjCValue}; }`,
      );
    case 'TypeAliasTypeAnnotation':
      return !isRequired
        ? `${value}.has_value() ? ${value}.value().buildUnsafeRawValue() : nil`
        : `${value}.buildUnsafeRawValue()`;
    default:
      typeAnnotation.type;
      throw new Error(
        `Couldn't convert into ObjC value: ${typeAnnotation.type}"`,
      );
  }
}
function serializeConstantsStruct(hasteModuleName, struct) {
  const declaration = StructTemplate({
    hasteModuleName,
    structName: struct.name,
    builderInputProps: struct.properties
      .map(property => {
        const typeAnnotation = property.typeAnnotation,
          optional = property.optional;
        const safePropName = getSafePropertyName(property);
        const objCType = toObjCType(hasteModuleName, typeAnnotation, optional);
        if (!optional) {
          return `RCTRequired<${objCType}> ${safePropName};`;
        }
        const space = ' '.repeat(objCType.endsWith('*') ? 0 : 1);
        return `${objCType}${space}${safePropName};`;
      })
      .join('\n          '),
  });
  const methods = MethodTemplate({
    hasteModuleName,
    structName: struct.name,
    properties: struct.properties
      .map(property => {
        const typeAnnotation = property.typeAnnotation,
          optional = property.optional,
          propName = property.name;
        const safePropName = getSafePropertyName(property);
        const objCValue = toObjCValue(
          hasteModuleName,
          typeAnnotation,
          safePropName,
          0,
          optional,
        );
        let varDecl = `auto ${safePropName} = i.${safePropName}`;
        if (!optional) {
          varDecl += '.get()';
        }
        const assignment = `d[@"${propName}"] = ` + objCValue;
        return `  ${varDecl};\n  ${assignment};`;
      })
      .join('\n'),
  });
  return {
    declaration,
    methods,
  };
}
module.exports = {
  serializeConstantsStruct,
};
