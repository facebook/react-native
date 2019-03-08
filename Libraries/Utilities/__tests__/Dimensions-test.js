/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
