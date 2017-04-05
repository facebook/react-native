/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.unmock('../Settings');
jest.unmock('Platform');

jest.unmock('BatchedBridge');
jest.unmock('defineLazyObjectProperty');
jest.unmock('MessageQueue');
jest.unmock('NativeModules');

let Platform = require('Platform');

const Settings  = require('Settings');

describe('Settings', () => {

  describe('setting and getting', () => {
    it('should set values and retrieve them', () => {

      if (Platform.OS == 'ios') {
        expect(true).toEqual(true);
        return;
      }

      Settings.set({oneKey: 1});
      Settings.set({twoKey: 2.0});
      Settings.set({threeKey: 'three'});

      const oneValue = Settings.get('oneKey');
      const twoValue = Settings.get('twoKey');
      const threeValue = Settings.get('threeKey');

      expect(oneValue === 1).toBe(true);
      expect(twoValue === 2.0).toBe(true);
      expect(threeValue === 'three').toBe(true);
    });
  });
});
