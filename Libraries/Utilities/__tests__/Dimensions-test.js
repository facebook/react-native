/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var Dimensions = require('../Dimensions');

describe('Dimensions', () => {

  describe('should have the correct methods', () => {

    describe('get', () => {
      it('should return an object with shape `width` and `height`', () => {
        expect(Dimensions.get).toBeTruthy();
        expect(typeof Dimensions.get).toEqual('function');

        const dim = Dimensions.get('');
        expect(dim).toHaveProperty('width');
        expect(dim).toHaveProperty('height');
        expect(typeof dim.width).toEqual('number');
        expect(typeof dim.height).toEqual('number');
      });
    });

  });

});
