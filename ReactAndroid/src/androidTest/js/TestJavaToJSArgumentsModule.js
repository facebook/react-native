/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const BatchedBridge = require('BatchedBridge');
const {assertEquals, assertTrue} = require('Asserts');

function strictStringCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a.charCodeAt(i) !== b.charCodeAt(i)) {
      return false;
    }
  }
  return true;
}

function assertStrictStringEquals(a, b) {
  assertTrue(strictStringCompare(a, b), 'Expected: ' + a + ', received: ' + b);
}

const TestJavaToJSArgumentsModule = {
  receiveBasicTypes: function(str, dbl, bool, null_arg) {
    assertEquals('foo', str);
    assertEquals(3.14, dbl);
    assertEquals(true, bool);
    assertEquals(null, null_arg);
  },
  receiveArrayWithBasicTypes: function(arr) {
    assertEquals(4, arr.length);
    assertEquals('red panda', arr[0]);
    assertEquals(1.19, arr[1]);
    assertEquals(true, arr[2]);
    assertEquals(null, arr[3]);
  },
  receiveNestedArray: function(arr) {
    assertEquals(2, arr.length);
    assertEquals('level1', arr[0]);
    const arr2 = arr[1];
    assertEquals('level2', arr2[0]);
    const arr3 = arr2[1];
    assertEquals('level3', arr3[0]);
  },
  receiveArrayWithMaps: function(arr) {
    assertEquals(2, arr.length);
    const m1 = arr[0];
    const m2 = arr[1];
    assertEquals('m1v1', m1.m1k1);
    assertEquals('m1v2', m1.m1k2);
    assertEquals('m2v1', m2.m2k1);
  },
  receiveMapWithBasicTypes: function(map) {
    assertEquals('stringValue', map.stringKey);
    assertEquals(3.14, map.doubleKey);
    assertEquals(true, map.booleanKey);
    assertEquals(null, map.nullKey);
  },
  receiveNestedMap: function(map) {
    const nestedMap = map.nestedMap;
    assertEquals('foxes', nestedMap.animals);
  },
  receiveMapWithArrays: function(map) {
    const a1 = map.array1;
    const a2 = map.array2;
    assertEquals(3, a1.length);
    assertEquals(2, a2.length);
    assertEquals(3, a1[0]);
    assertEquals(9, a2[1]);
  },
  receiveMapAndArrayWithNullValues: function(map, array) {
    assertEquals(null, map.string);
    assertEquals(null, map.array);
    assertEquals(null, map.map);

    assertEquals(null, array[0]);
    assertEquals(null, array[1]);
    assertEquals(null, array[2]);
  },
  receiveMapWithMultibyteUTF8CharacterString: function(map) {
    assertStrictStringEquals('\u00A2', map['two-bytes']);
    assertStrictStringEquals('\u20AC', map['three-bytes']);
    assertStrictStringEquals('\uD83D\uDE1C', map['four-bytes']);
    assertStrictStringEquals(
      '\u017C\u00F3\u0142\u0107 g\u0119\u015Bl\u0105 \u6211 \uD83D\uDE0E ja\u017A\u0107',
      map.mixed,
    );
  },
  receiveArrayWithMultibyteUTF8CharacterString: function(array) {
    assertTrue(true);
    assertStrictStringEquals('\u00A2', array[0]);
    assertStrictStringEquals('\u20AC', array[1]);
    assertStrictStringEquals('\uD83D\uDE1C', array[2]);
    assertStrictStringEquals(
      '\u017C\u00F3\u0142\u0107 g\u0119\u015Bl\u0105 \u6211 \uD83D\uDE0E ja\u017A\u0107',
      array[3],
    );
  },
};

BatchedBridge.registerCallableModule(
  'TestJavaToJSArgumentsModule',
  TestJavaToJSArgumentsModule,
);

module.exports = TestJavaToJSArgumentsModule;
