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
 *   - assertThisInitialized
 *   - classCallCheck
 *   - createClass
 *   - defineProperty
 *   - extends
 *   - get
 *   - inherits
 *   - interopRequireDefault
 *   - interopRequireWildcard
 *   - objectWithoutProperties
 *   - possibleConstructorReturn
 *   - slicedToArray
 *   - taggedTemplateLiteral
 *   - taggedTemplateLiteralLoose
 *   - toArray
 *   - toConsumableArray
 *   - wrapNativeSuper
 *
 * @flow
 * @generated (with babel 7.0.0-beta.40)
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

// ### get ###

function _get(object, property, receiver) {
  if (object === null) {
    object = Function.prototype;
  }
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return _get(parent, property, receiver);
    }
  } else if ('value' in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
}

babelHelpers.get = _get;

// ### inherits ###

function _inherits(subClass, superClass) {
  if (typeof superClass !== 'function' && superClass !== null) {
    throw new TypeError('Super expression must either be null or a function');
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });
  if (superClass) {
    Object.setPrototypeOf
      ? Object.setPrototypeOf(subClass, superClass)
      : (subClass.__proto__ = superClass);
  }
}

babelHelpers.inherits = _inherits;

// ### wrapNativeSuper ###

var _gPO =
  Object.getPrototypeOf ||
  function _gPO(o) {
    return o.__proto__;
  };

var _sPO =
  Object.setPrototypeOf ||
  function _sPO(o, p) {
    o.__proto__ = p;
    return o;
  };

var _construct =
  // FB:
  // TODO: prepack does not like this line (and we can use the fallback just fine)
  // (typeof Reflect === "object" && Reflect.construct) ||
  function _construct(Parent, args, Class) {
    var Constructor,
      a = [null];
    a.push.apply(a, args);
    Constructor = Parent.bind.apply(Parent, a);
    return _sPO(new Constructor(), Class.prototype);
  };

var _cache = typeof Map === 'function' && new Map();

function _wrapNativeSuper(Class) {
  // FB:
  // Note: while extending native classes is pretty meh we do have cases, for
  // example; Error. There is also a false positive, for example; Blob.
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
    return _construct(Class, arguments, _gPO(this).constructor);
  }

  Wrapper.prototype = Object.create(Class.prototype, {
    constructor: {
      value: Wrapper,
      enumerable: false,
      writeable: true,
      configurable: true,
    },
  });
  return _sPO(
    Wrapper,
    _sPO(function Super() {
      return _construct(Class, arguments, _gPO(this).constructor);
    }, Class),
  );
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

  if (self === void 0) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called",
    );
  }

  return self;
}

babelHelpers.possibleConstructorReturn = _possibleConstructorReturn;

// ### slicedToArray ###

function _sliceIterator(arr, i) {
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

function _slicedToArray(arr, i) {
  if (Array.isArray(arr)) {
    return arr;
  } else if (Symbol.iterator in Object(arr)) {
    return _sliceIterator(arr, i);
  } else {
    throw new TypeError('Invalid attempt to destructure non-iterable instance');
  }
}

babelHelpers.slicedToArray = _slicedToArray;

// ### taggedTemplateLiteral ###

function _taggedTemplateLiteral(strings, raw) {
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
  return Array.isArray(arr) ? arr : Array.from(arr);
}

babelHelpers.toArray = _toArray;

// ### toConsumableArray ###

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  } else {
    return Array.from(arr);
  }
}

babelHelpers.toConsumableArray = _toConsumableArray;

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

// ### taggedTemplateLiteralLoose ###

function _taggedTemplateLiteralLoose(strings, raw) {
  strings.raw = raw;
  return strings;
}

babelHelpers.taggedTemplateLiteralLoose = _taggedTemplateLiteralLoose;
