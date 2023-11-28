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

function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r &&
      (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })),
      t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2
      ? ownKeys(Object(t), !0).forEach(function (r) {
          _defineProperty(e, r, t[r]);
        })
      : Object.getOwnPropertyDescriptors
      ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
      : ownKeys(Object(t)).forEach(function (r) {
          Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
  }
  return e;
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, 'string');
  return 'symbol' == typeof i ? i : String(i);
}
function _toPrimitive(t, r) {
  if ('object' != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || 'default');
    if ('object' != typeof i) return i;
    throw new TypeError('@@toPrimitive must return a primitive value.');
  }
  return ('string' === r ? String : Number)(t);
}
const _require = require('../../Utils'),
  capitalize = _require.capitalize;
class PojoCollector {
  constructor() {
    _defineProperty(this, '_pojos', new Map());
  }
  process(namespace, pojoName, typeAnnotation) {
    switch (typeAnnotation.type) {
      case 'ObjectTypeAnnotation': {
        this._insertPojo(namespace, pojoName, typeAnnotation);
        return {
          type: 'PojoTypeAliasTypeAnnotation',
          name: pojoName,
        };
      }
      case 'ArrayTypeAnnotation': {
        const arrayTypeAnnotation = typeAnnotation;
        const elementType = arrayTypeAnnotation.elementType;
        const pojoElementType = (() => {
          switch (elementType.type) {
            case 'ObjectTypeAnnotation': {
              this._insertPojo(namespace, `${pojoName}Element`, elementType);
              return {
                type: 'PojoTypeAliasTypeAnnotation',
                name: `${pojoName}Element`,
              };
            }
            case 'ArrayTypeAnnotation': {
              const objectTypeAnnotation = elementType.elementType;
              this._insertPojo(
                namespace,
                `${pojoName}ElementElement`,
                objectTypeAnnotation,
              );
              return {
                type: 'ArrayTypeAnnotation',
                elementType: {
                  type: 'PojoTypeAliasTypeAnnotation',
                  name: `${pojoName}ElementElement`,
                },
              };
            }
            default: {
              return elementType;
            }
          }
        })();
        return {
          type: 'ArrayTypeAnnotation',
          elementType: pojoElementType,
        };
      }
      default:
        return typeAnnotation;
    }
  }
  _insertPojo(namespace, pojoName, objectTypeAnnotation) {
    const properties = objectTypeAnnotation.properties.map(property => {
      const propertyPojoName = pojoName + capitalize(property.name);
      return _objectSpread(
        _objectSpread({}, property),
        {},
        {
          typeAnnotation: this.process(
            namespace,
            propertyPojoName,
            property.typeAnnotation,
          ),
        },
      );
    });
    this._pojos.set(pojoName, {
      name: pojoName,
      namespace,
      properties,
    });
  }
  getAllPojos() {
    return [...this._pojos.values()];
  }
}
module.exports = PojoCollector;
