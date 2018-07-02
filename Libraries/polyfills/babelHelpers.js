/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Regenerate through
 *    `js1 upgrade babel-helpers` + manual tweaks
 *
 * Components used for this file;
 *   - arrayWithHoles
 *   - arrayWithoutHoles
 *   - assertThisInitialized
 *   - classCallCheck
 *   - construct
 *   - createClass
 *   - defineProperty
 *   - extends
 *   - get
 *   - getPrototypeOf
 *   - inherits
 *   - interopRequireDefault
 *   - interopRequireWildcard
 *   - iterableToArray
 *   - iterableToArrayLimit
 *   - nonIterableRest
 *   - nonIterableSpread
 *   - objectSpread
 *   - objectWithoutProperties
 *   - possibleConstructorReturn
 *   - setPrototypeOf
 *   - slicedToArray
 *   - superPropBase
 *   - taggedTemplateLiteral
 *   - taggedTemplateLiteralLoose
 *   - toArray
 *   - toConsumableArray
 *   - wrapNativeSuper
 *
 * @flow
 * @generated (with babel 7.0.0-beta.47)
 * @format
 * @nolint
 * @polyfill
 */

'use strict';

var babelHelpers = (global.babelHelpers = {});

// ### classCallCheck ###

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

babelHelpers.classCallCheck = _classCallCheck;

// ### createClass ###

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ('value' in descriptor) {
      descriptor.writable = true;
    }
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) {
    _defineProperties(Constructor.prototype, protoProps);
  }
  if (staticProps) {
    _defineProperties(Constructor, staticProps);
  }
  return Constructor;
}

babelHelpers.createClass = _createClass;

// ### defineProperty ###

function _defineProperty(obj, key, value) {
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

babelHelpers.defineProperty = _defineProperty;

// ### extends ###

function _extends() {
  babelHelpers.extends = _extends =
    Object.assign ||
    function(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

  return _extends.apply(this, arguments);
}

babelHelpers.extends = _extends;

// ### setPrototypeOf ###

function _setPrototypeOf(o, p) {
  babelHelpers.setPrototypeOf = _setPrototypeOf =
    Object.setPrototypeOf ||
    function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

  return _setPrototypeOf(o, p);
}

babelHelpers.setPrototypeOf = _setPrototypeOf;

// ### superPropBase ###

function _superPropBase(object, property) {
  while (!Object.prototype.hasOwnProperty.call(object, property)) {
    object = babelHelpers.getPrototypeOf(object);
    if (object === null) {
      break;
    }
  }

  return object;
}

babelHelpers.superPropBase = _superPropBase;

// ### get ###

// FB:
// TODO: prepack does not like Reflect (and we can use the fallback just fine)
// function _get(target, property, receiver) {
//   if (typeof Reflect !== 'undefined' && Reflect.get) {
//     babelHelpers.get = _get = Reflect.get;
//   } else {
//     babelHelpers.get = _get = function _get(target, property, receiver) {
//       var base = babelHelpers.superPropBase(target, property);
//       if (!base) {
//         return;
//       }
//       var desc = Object.getOwnPropertyDescriptor(base, property);
//
//       if (desc.get) {
//         return desc.get.call(receiver);
//       }
//
//       return desc.value;
//     };
//   }
//
//   return _get(target, property, receiver || target);
// }
//
// babelHelpers.get = _get;

babelHelpers.get = function _get(target, property, receiver = target) {
  var base = babelHelpers.superPropBase(target, property);
  if (!base) {
    return;
  }
  var desc = Object.getOwnPropertyDescriptor(base, property);

  if (desc.get) {
    return desc.get.call(receiver);
  }

  return desc.value;
}


// ### inherits ###

function _inherits(subClass, superClass) {
  if (typeof superClass !== 'function' && superClass !== null) {
    throw new TypeError('Super expression must either be null or a function');
  }

  babelHelpers.setPrototypeOf(
    subClass.prototype,
    superClass && superClass.prototype,
  );
  if (superClass) {
    babelHelpers.setPrototypeOf(subClass, superClass);
  }
}

babelHelpers.inherits = _inherits;

// ### construct ###

function _construct(Parent, args, Class) {
  // FB:
  // TODO: prepack does not like this line (and we can use the fallback just fine)
  // if (typeof Reflect !== 'undefined' && Reflect.construct) {
  //   babelHelpers.construct = _construct = Reflect.construct;
  // } else {
  babelHelpers.construct = _construct = function _construct(
    Parent,
    args,
    Class,
  ) {
    var a = [null];
    a.push.apply(a, args);
    var Constructor = Parent.bind.apply(Parent, a);
    var instance = new Constructor();
    if (Class) {
      babelHelpers.setPrototypeOf(instance, Class.prototype);
    }
    return instance;
  };
  // }

  return _construct.apply(null, arguments);
}

babelHelpers.construct = _construct;

// ### getPrototypeOf ###

function _getPrototypeOf(o) {
  babelHelpers.getPrototypeOf = _getPrototypeOf =
    Object.getPrototypeOf ||
    function _getPrototypeOf(o) {
      return o.__proto__;
    };

  return _getPrototypeOf(o);
}

babelHelpers.getPrototypeOf = _getPrototypeOf;

// ### assertThisInitialized ###

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called",
    );
  }

  return self;
}

babelHelpers.assertThisInitialized = _assertThisInitialized;

// ### wrapNativeSuper ###

function _wrapNativeSuper(Class) {
  var _cache = typeof Map === 'function' ? new Map() : undefined;

  babelHelpers.wrapNativeSuper = _wrapNativeSuper = function _wrapNativeSuper(
    Class,
  ) {
    if (typeof Class !== 'function') {
      throw new TypeError('Super expression must either be null or a function');
    }

    if (typeof _cache !== 'undefined') {
      if (_cache.has(Class)) {
        return _cache.get(Class);
      }

      _cache.set(Class, Wrapper);
    }

    function Wrapper() {
      // FB:
      // this is a temporary fix for a babel bug (it's invoking the wrong func
      // when you do `super()`)
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }

    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true,
      },
    });
    return babelHelpers.setPrototypeOf(
      Wrapper,
      babelHelpers.setPrototypeOf(function Super() {
        return babelHelpers.construct(
          Class,
          arguments,
          babelHelpers.getPrototypeOf(this).constructor,
        );
      }, Class),
    );
  };

  return _wrapNativeSuper(Class);
}

babelHelpers.wrapNativeSuper = _wrapNativeSuper;

// ### interopRequireDefault ###

function _interopRequireDefault(obj) {
  return obj && obj.__esModule
    ? obj
    : {
        default: obj,
      };
}

babelHelpers.interopRequireDefault = _interopRequireDefault;

// ### interopRequireWildcard ###

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};

    if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          var desc =
            Object.defineProperty && Object.getOwnPropertyDescriptor
              ? Object.getOwnPropertyDescriptor(obj, key)
              : {};

          if (desc.get || desc.set) {
            Object.defineProperty(newObj, key, desc);
          } else {
            newObj[key] = obj[key];
          }
        }
      }
    }

    newObj.default = obj;
    return newObj;
  }
}

babelHelpers.interopRequireWildcard = _interopRequireWildcard;

// ### objectWithoutProperties ###

function _objectWithoutProperties(source, excluded) {
  if (source == null) {
    return {};
  }
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) {
      continue;
    }
    target[key] = source[key];
  }

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) {
        continue;
      }
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) {
        continue;
      }
      target[key] = source[key];
    }
  }

  return target;
}

babelHelpers.objectWithoutProperties = _objectWithoutProperties;

// ### possibleConstructorReturn ###

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === 'object' || typeof call === 'function')) {
    return call;
  }

  return babelHelpers.assertThisInitialized(self);
}

babelHelpers.possibleConstructorReturn = _possibleConstructorReturn;

// ### arrayWithHoles ###

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) {
    return arr;
  }
}

babelHelpers.arrayWithHoles = _arrayWithHoles;

// ### arrayWithoutHoles ###

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }
}

babelHelpers.arrayWithoutHoles = _arrayWithoutHoles;

// ### iterableToArrayLimit ###

function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (
      var _i = arr[Symbol.iterator](), _s;
      !(_n = (_s = _i.next()).done);
      _n = true
    ) {
      _arr.push(_s.value);

      if (i && _arr.length === i) {
        break;
      }
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i.return != null) {
        _i.return();
      }
    } finally {
      if (_d) {
        throw _e;
      }
    }
  }

  return _arr;
}

babelHelpers.iterableToArrayLimit = _iterableToArrayLimit;

// ### nonIterableRest ###

function _nonIterableRest() {
  throw new TypeError('Invalid attempt to destructure non-iterable instance');
}

babelHelpers.nonIterableRest = _nonIterableRest;

// ### nonIterableSpread ###

function _nonIterableSpread() {
  throw new TypeError('Invalid attempt to spread non-iterable instance');
}

babelHelpers.nonIterableSpread = _nonIterableSpread;

// ### slicedToArray ###

function _slicedToArray(arr, i) {
  return (
    babelHelpers.arrayWithHoles(arr) ||
    babelHelpers.iterableToArrayLimit(arr, i) ||
    babelHelpers.nonIterableRest()
  );
}

babelHelpers.slicedToArray = _slicedToArray;

// ### taggedTemplateLiteral ###

function _taggedTemplateLiteral(strings, raw) {
  if (!raw) {
    raw = strings.slice(0);
  }

  return Object.freeze(
    Object.defineProperties(strings, {
      raw: {
        value: Object.freeze(raw),
      },
    }),
  );
}

babelHelpers.taggedTemplateLiteral = _taggedTemplateLiteral;

// ### toArray ###

function _toArray(arr) {
  return (
    babelHelpers.arrayWithHoles(arr) ||
    babelHelpers.iterableToArray(arr) ||
    babelHelpers.nonIterableRest()
  );
}

babelHelpers.toArray = _toArray;

// ### toConsumableArray ###

function _toConsumableArray(arr) {
  return (
    babelHelpers.arrayWithoutHoles(arr) ||
    babelHelpers.iterableToArray(arr) ||
    babelHelpers.nonIterableSpread()
  );
}

babelHelpers.toConsumableArray = _toConsumableArray;

// ### taggedTemplateLiteralLoose ###

function _taggedTemplateLiteralLoose(strings, raw) {
  if (!raw) {
    raw = strings.slice(0);
  }

  strings.raw = raw;
  return strings;
}

babelHelpers.taggedTemplateLiteralLoose = _taggedTemplateLiteralLoose;

// ### objectSpread ###

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(
        Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }),
      );
    }

    ownKeys.forEach(function(key) {
      babelHelpers.defineProperty(target, key, source[key]);
    });
  }

  return target;
}

babelHelpers.objectSpread = _objectSpread;

// ### iterableToArray ###

function _iterableToArray(iter) {
  if (
    Symbol.iterator in Object(iter) ||
    Object.prototype.toString.call(iter) === '[object Arguments]'
  ) {
    return Array.from(iter);
  }
}

babelHelpers.iterableToArray = _iterableToArray;
