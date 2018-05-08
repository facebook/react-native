/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @polyfill
 * @nolint
 */

/* eslint-disable quotes, curly, no-proto, no-undef-init, dot-notation */

// Created by running:
// require('fs').writeFileSync('babelExternalHelpers.js', require('@babel/core').buildExternalHelpers('_extends classCallCheck createClass createRawReactElement defineProperty get inherits  interopRequireDefault interopRequireWildcard objectWithoutProperties possibleConstructorReturn slicedToArray taggedTemplateLiteral toArray toConsumableArray wrapNativeSuper assertThisInitialized taggedTemplateLiteralLoose'.split(' ')))// then replacing the `global` reference in the last line to also use `this`.
//
// Actually, that's a lie, because babel omits _extends and
// createRawReactElement. the file is also cleaned up a bit.
// You may need to clear wrapNativeSuper while the bug hasn't been fixed yet.
// Do try to keep diffs to a minimum.

var babelHelpers = global.babelHelpers = {};

babelHelpers.createRawReactElement = (function () {
  var REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol.for && Symbol.for("react.element") || 0xeac7;
  return function createRawReactElement(type, key, props) {
    return {
      $$typeof: REACT_ELEMENT_TYPE,
      type: type,
      key: key,
      ref: null,
      props: props,
      _owner: null
    };
  };
})();

babelHelpers.classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

babelHelpers.createClass = function(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
};

babelHelpers.defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

babelHelpers._extends = babelHelpers.extends = Object.assign || function (target) {
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

babelHelpers.get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

babelHelpers.inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var _gPO = Object.getPrototypeOf || function _gPO(o) { return o.__proto__ };
var _sPO = Object.setPrototypeOf || function _sPO(o, p) { o.__proto__ = p; return o };
var _construct =
// TODO: prepack does not like this line (and we can use the fallback just fine)
// (typeof Reflect === "object" && Reflect.construct) ||
  function _construct(Parent, args, Class) {
    var Constructor, a = [null];
    a.push.apply(a, args);
    Constructor = Parent.bind.apply(Parent, a);
    return _sPO(new Constructor, Class.prototype);
  };
var _cache = typeof Map === "function" && new Map();
babelHelpers.wrapNativeSuper = function(Class) {
  // FB:
  // Note: while extending native classes is pretty meh we do have cases, for
  // example; Error. There is also a false positive, for example; Blob.

  if (typeof Class !== "function") {
    throw new TypeError("Super expression must either be null or a function");
  }
  if (typeof _cache !== "undefined") {
    if (_cache.has(Class)) return _cache.get(Class);
    _cache.set(Class, Wrapper);
  }
  function Wrapper() {
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
    }
  });
  return _sPO(
    Wrapper,
    _sPO(
      function Super() {
        return _construct(Class, arguments, _gPO(this).constructor);
      },
      Class
    )
  );
};

babelHelpers.interopRequireDefault = function (obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
};

babelHelpers.interopRequireWildcard = function (obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};

    if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};

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
};

babelHelpers.objectWithoutProperties = function(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
};

babelHelpers.possibleConstructorReturn = function (self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  }

  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
};

function _sliceIterator(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

babelHelpers.slicedToArray = function(arr, i) {
  if (Array.isArray(arr)) {
    return arr;
  } else if (Symbol.iterator in Object(arr)) {
    return _sliceIterator(arr, i);
  } else {
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
  }
};

babelHelpers.taggedTemplateLiteral = function (strings, raw) {
  return Object.freeze(Object.defineProperties(strings, {
    raw: {
      value: Object.freeze(raw)
    }
  }));
};

babelHelpers.toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

babelHelpers.toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

babelHelpers.assertThisInitialized = function(self) {
  if (self === void 0) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called",
    );
  }

  return self;
};

babelHelpers.taggedTemplateLiteralLoose = function(strings, raw) {
  strings.raw = raw;
  return strings;
};
