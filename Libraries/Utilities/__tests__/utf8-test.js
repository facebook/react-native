/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+react_native
 */

'use strict';

const {encode} = require('../utf8');

describe('UTF-8 encoding:', () => {
   it('can encode code points < U+80', () => {
     const arrayBuffer = encode('\u0000abcDEF\u007f');
     expect(new Uint8Array(arrayBuffer)).toEqual(
       new Uint8Array([0x00, 0x61, 0x62, 0x63, 0x44, 0x45, 0x46, 0x7f]));
   });

   it('can encode code points < U+800', () => {
     const arrayBuffer = encode('\u0080\u0548\u07ff');
     expect(new Uint8Array(arrayBuffer)).toEqual(
       new Uint8Array([0xc2, 0x80, 0xd5, 0x88, 0xdf, 0xbf]));
   });

   it('can encode code points < U+10000', () => {
     const arrayBuffer = encode('\u0800\uac48\uffff');
     expect(new Uint8Array(arrayBuffer)).toEqual(
       new Uint8Array([0xe0, 0xa0, 0x80, 0xea, 0xb1, 0x88, 0xef, 0xbf, 0xbf]));
   });

   it('can encode code points in the Supplementary Planes (surrogate pairs)', () => {
     const arrayBuffer = encode([
       '\ud800\udc00',
       '\ud800\ude89',
       '\ud83d\ude3b',
       '\udbff\udfff'
     ].join(''));
     expect(new Uint8Array(arrayBuffer)).toEqual(
       new Uint8Array([
         0xf0, 0x90, 0x80, 0x80,
         0xf0, 0x90, 0x8a, 0x89,
         0xf0, 0x9f, 0x98, 0xbb,
         0xf4, 0x8f, 0xbf, 0xbf,
       ])
     );
   });

   it('allows for stray high surrogates', () => {
     const arrayBuffer = encode(String.fromCharCode(0x61, 0xd8c6, 0x62));
     expect(new Uint8Array(arrayBuffer)).toEqual(
       new Uint8Array([0x61, 0xed, 0xa3, 0x86, 0x62]));
   });

   it('allows for stray low surrogates', () => {
     const arrayBuffer = encode(String.fromCharCode(0x61, 0xde19, 0x62));
     expect(new Uint8Array(arrayBuffer)).toEqual(
       new Uint8Array([0x61, 0xed, 0xb8, 0x99, 0x62]));
   });
});
