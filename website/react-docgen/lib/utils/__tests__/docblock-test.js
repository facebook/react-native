/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

"use strict";

jest.autoMockOff();

describe('docblock', function() {

  describe('getDoclets', function() {
    var getDoclets;

    beforeEach(function() {
      getDoclets = require('../docblock').getDoclets;
    });

    it('extacts single line doclets', function() {
      expect(getDoclets('@foo bar\n@bar baz'))
        .toEqual({foo: 'bar', bar: 'baz'});
    });

    it('extacts multi line doclets', function() {
      expect(getDoclets('@foo bar\nbaz\n@bar baz'))
        .toEqual({foo: 'bar\nbaz', bar: 'baz'});
    });

    it('extacts boolean doclets', function() {
      expect(getDoclets('@foo bar\nbaz\n@abc\n@bar baz'))
        .toEqual({foo: 'bar\nbaz', abc: true, bar: 'baz'});
    });
  });

});
