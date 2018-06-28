/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

var BatchedBridge = require('BatchedBridge');
var Recording = require('NativeModules').Recording;

var TestJSToJavaParametersModule = {
  returnBasicTypes: function() {
    Recording.receiveBasicTypes('foo', 3.14, true, null);
  },
  returnBoxedTypes: function() {
    Recording.receiveBoxedTypes(42, 3.14, true);
  },
  returnDynamicTypes: function() {
    Recording.receiveDynamic('foo');
    Recording.receiveDynamic(3.14);
  },
  returnArrayWithBasicTypes: function() {
    Recording.receiveArray(['foo', 3.14, -111, true, null]);
  },
  returnNestedArray: function() {
    Recording.receiveArray(['we', ['have', ['to', ['go', ['deeper']]]]]);
  },
  returnArrayWithMaps: function() {
    Recording.receiveArray([{m1k1: 'm1v1', m1k2: 'm1v2'}, {m2k1: 'm2v1'}]);
  },
  returnMapWithBasicTypes: function() {
    Recording.receiveMap({
      stringKey: 'stringValue',
      doubleKey: 3.14,
      intKey: -11,
      booleanKey: true,
      nullKey: null,
    });
  },
  returnNestedMap: function() {
    Recording.receiveMap({
      weHaveToGoDeeper: {
        inception: true,
      },
    });
  },
  returnMapWithArrays: function() {
    Recording.receiveMap({
      empty: [],
      ints: [43, 44],
      mixed: [77, 'string', ['another', 'array']],
    });
  },
  returnArrayWithStringDoubleIntMapArrayBooleanNull: function() {
    Recording.receiveArray(['string', 3.14, 555, {}, [], true, null]);
  },
  returnMapWithStringDoubleIntMapArrayBooleanNull: function() {
    Recording.receiveMap({
      string: 'string',
      double: 3,
      map: {},
      int: -55,
      array: [],
      boolean: true,
      null: null,
    });
  },
  returnArrayWithLargeInts: function() {
    Recording.receiveArray([2147483648, -5555555555]);
  },
  returnMapWithLargeInts: function() {
    Recording.receiveMap({first: -2147483649, second: 5551231231});
  },
  returnMapForMerge1: function() {
    Recording.receiveMap({
      a: 1,
      b: 41,
      c: 'string',
      d: 'other string',
      e: [1, 'foo', 'bar'],
      f: null,
    });
  },
  returnMapForMerge2: function() {
    Recording.receiveMap({
      a: 'overwrite',
      d: 77,
      e: null,
      f: ['array', 'with', 'stuff'],
      newkey: 'newvalue',
    });
  },
  returnMapWithMultibyteUTF8CharacterString: function() {
    Recording.receiveMap({
      'one-byte': 'a',
      'two-bytes': '\u00A2',
      'three-bytes': '\u20AC',
      'four-bytes': '\uD83D\uDE1C',
      mixed:
        '\u017C\u00F3\u0142\u0107 g\u0119\u015Bl\u0105 \u6211 \uD83D\uDE0E ja\u017A\u0107',
    });
  },
  returnArrayWithMultibyteUTF8CharacterString: function() {
    Recording.receiveArray([
      'a',
      '\u00A2',
      '\u20AC',
      '\uD83D\uDE1C',
      '\u017C\u00F3\u0142\u0107 g\u0119\u015Bl\u0105 \u6211 \uD83D\uDE0E ja\u017A\u0107',
    ]);
  },
};

BatchedBridge.registerCallableModule(
  'TestJSToJavaParametersModule',
  TestJSToJavaParametersModule,
);

module.exports = TestJSToJavaParametersModule;
