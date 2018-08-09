/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const View = require('View');
const Image = require('Image');
const createAnimatedComponent = require('createAnimatedComponent');
describe('createAnimatedComponent tests', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  describe('Animated.View', function() {
    it('should create component without error', function() {
      const AnimatedViewComponent = createAnimatedComponent(View);

      const instance = new AnimatedViewComponent();

      expect(instance).toBeTruthy();
    });
  });
  describe('Animated.Image', function() {
    it('should create component without error', function() {
      const AnimatedImageComponent = createAnimatedComponent(Image);

      const instance = new AnimatedImageComponent();

      expect(instance).toBeTruthy();
    });
  });
});
